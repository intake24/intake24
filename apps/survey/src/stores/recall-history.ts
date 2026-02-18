import type { SurveyStore } from './survey';
import type { ComponentType } from '@intake24/common/prompts';
import type { SurveyState as CurrentSurveyState } from '@intake24/common/surveys';

import { toRaw } from 'vue';

import { copy } from '@intake24/common/util';

import { getOrCreatePromptStateStore, promptStores } from './prompt';

const MAX_UNDO_STACK = 100;

interface PromptStoreSnapshot {
  type: ComponentType;
  prompts: Record<string, Record<string, unknown>>;
}

type HistoryEntryType = 'full' | 'prompt';

interface RecallHistoryBase {
  recallHistoryType: HistoryEntryType;
  description: string;
}

interface FullHistoryEntry extends RecallHistoryBase {
  recallHistoryType: 'full';
  surveyData: CurrentSurveyState;
  promptStates: PromptStoreSnapshot[];
}

interface PromptHistoryEntry extends RecallHistoryBase {
  recallHistoryType: 'prompt';
  promptState: unknown;
}

type RecallHistoryEntry = FullHistoryEntry | PromptHistoryEntry;

export type HandlePopStateResult = 'none' | 'full' | 'prompt';

let survey: SurveyStore | null = null;
const undoStack: RecallHistoryEntry[] = [];
const redoStack: RecallHistoryEntry[] = [];
let currentStateId = 0;

let promptHistoryGetState: (() => unknown) | null = null;
let promptHistorySetState: ((state: unknown) => void) | null = null;

export function registerPromptHistoryHandler(
  get: () => unknown,
  set: (state: unknown) => void,
) {
  promptHistoryGetState = get;
  promptHistorySetState = set;
}

export function unregisterPromptHistoryHandler() {
  promptHistoryGetState = null;
  promptHistorySetState = null;
}

function log(label: string, ...args: unknown[]) {
  console.log(`[recall-history] ${label}`, ...args);
}

function logStacks(label: string) {
  log(
    `${label} | currentStateId=${currentStateId} undo=[${undoStack.map(e => e.description).join(', ')}] redo=[${redoStack.map(e => e.description).join(', ')}]`,
  );
}

function getPromptStoreSnapshots(): PromptStoreSnapshot[] {
  const snapshots: PromptStoreSnapshot[] = [];
  for (const [type, storeDef] of promptStores) {
    const store = storeDef();
    snapshots.push({
      type,
      prompts: copy(toRaw(store.prompts)),
    });
  }
  return snapshots;
}

function restorePromptStores(snapshots: PromptStoreSnapshot[]) {
  const snapshotTypes = new Set(snapshots.map(s => s.type));

  for (const [type, storeDef] of promptStores) {
    if (!snapshotTypes.has(type)) {
      const store = storeDef();
      const ids = Object.keys(store.prompts);
      if (ids.length)
        store.clearState(ids);
    }
  }

  for (const { type, prompts } of snapshots) {
    const store = getOrCreatePromptStateStore(type)();
    store.prompts = copy(prompts);
  }
}

function restorePromptState(state: unknown) {
  if (!promptHistorySetState) {
    console.error('[recall-history] No prompt history handler registered, cannot restore');
    return;
  }

  promptHistorySetState(state);
}

function createFullHistoryEntry(description: string): FullHistoryEntry {
  if (!survey)
    throw new Error('Recall history not initialised');

  const snapshot: FullHistoryEntry = {
    recallHistoryType: 'full',
    surveyData: copy(toRaw(survey.data)),
    promptStates: getPromptStoreSnapshots(),
    description,
  };

  log(
    `captured: "${description}" | meals=${snapshot.surveyData.meals.length} flags=[${snapshot.surveyData.flags.join(',')}] selection=${JSON.stringify(snapshot.surveyData.selection.element)}`,
  );

  return snapshot;
}

function createPromptHistoryEntry(description: string): PromptHistoryEntry | null {
  if (!promptHistoryGetState) {
    console.error('[recall-history] No prompt history handler registered');
    return null;
  }

  const promptState = copy(toRaw(promptHistoryGetState()));

  return {
    recallHistoryType: 'prompt',
    description,
    promptState,
  };
}

function restoreState(savedState: RecallHistoryEntry) {
  if (!survey)
    throw new Error('Recall history not initialised');

  if (savedState.recallHistoryType === 'full') {
    log(
      `Restoring full state: "${savedState.description}"`,
    );

    survey.loadState(copy(savedState.surveyData));
    restorePromptStores(savedState.promptStates);
  }
  else {
    log(
      `Restoring prompt state: "${savedState.description}"`,
    );

    restorePromptState(savedState.promptState);
  }
}

export function initRecallHistory(store: SurveyStore) {
  survey = store;
  undoStack.length = 0;
  redoStack.length = 0;
  currentStateId = 0;
  history.replaceState({ recallHistory: true, stateId: currentStateId }, '', window.location.href);
  log(`init | stateId=${currentStateId}`);
}

export function destroyRecallHistory() {
  log('destroy');
  survey = null;
  undoStack.length = 0;
  redoStack.length = 0;
}

export function pushFullHistoryEntry(description: string) {
  if (!survey) {
    console.error('Recall history not initialised, cannot push state');
    return;
  }

  log(`pushFullHistoryEntry: "${description}" | stateId before=${currentStateId}`);

  if (undoStack.length >= MAX_UNDO_STACK) {
    const dropped = undoStack.shift();
    log(`dropped oldest entry: "${dropped?.description}"`);
  }

  undoStack.push(createFullHistoryEntry(description));

  invalidateForward();

  ++currentStateId;
  history.pushState({ recallHistory: true, stateId: currentStateId }, '', window.location.href);

  logStacks('after pushFullHistoryEntry');
}

export function pushPromptHistoryEntry(description: string) {
  if (!survey) {
    console.error('[recall-history] not initialised, cannot save state');
    return;
  }

  log(`pushPromptHistoryEntry: "${description}" | stateId before=${currentStateId}`);

  if (undoStack.length >= MAX_UNDO_STACK) {
    const dropped = undoStack.shift();
    log(`dropped oldest entry: "${dropped?.description}"`);
  }

  const entry = createPromptHistoryEntry(description);

  if (entry != null)
    undoStack.push(entry);

  invalidateForward();

  ++currentStateId;
  history.pushState({ recallHistory: true, stateId: currentStateId }, '', window.location.href);

  logStacks('after pushPromptHistoryEntry');
}

export function invalidateForward() {
  if (redoStack.length) {
    log(`invalidateForward: clearing ${redoStack.length} redo entries`);
    redoStack.length = 0;
  }
}

export function goBack(): HandlePopStateResult {
  log(`goBack called | undoStack.length=${undoStack.length}`);

  const entry = undoStack.pop();
  if (!entry) {
    log('goBack: no previous state available');
    return 'none';
  }

  log(`goBack: will restore "${entry.description}"`);

  if (entry.recallHistoryType === 'full') {
    redoStack.push(createFullHistoryEntry(`(redo) ${entry.description}`));
  }
  else {
    const redoEntry = createPromptHistoryEntry(`(redo) ${entry.description}`);
    if (redoEntry != null)
      redoStack.push(redoEntry);
  }

  restoreState(entry);

  logStacks('after goBack');
  return entry.recallHistoryType;
}

export function goForward(): HandlePopStateResult {
  log(`goForward called | redoStack.length=${redoStack.length}`);

  const entry = redoStack.pop();
  if (!entry) {
    log('goForward: nothing to redo');
    return 'none';
  }

  log(`goForward: will restore "${entry.description}", saving current to undo`);

  if (entry.recallHistoryType === 'full') {
    undoStack.push(createFullHistoryEntry(entry.description));
  }
  else {
    const undoEntry = createPromptHistoryEntry(entry.description);
    if (undoEntry != null)
      undoStack.push(undoEntry);
  }

  restoreState(entry);

  logStacks('after goForward');
  return entry.recallHistoryType;
}

export function handlePopState(event: PopStateEvent): HandlePopStateResult {
  log('popstate | event.state=', event.state, `| currentStateId=${currentStateId}`);

  if (!event.state?.recallHistory || typeof event.state.stateId !== 'number') {
    log('popstate: not a recall history entry, ignoring');
    return 'none';
  }

  const targetStateId = event.state.stateId as number;
  log(`popstate: targetStateId=${targetStateId} currentStateId=${currentStateId}`);

  if (targetStateId < currentStateId) {
    log(`popstate: going BACK (${currentStateId} -> ${targetStateId})`);
    currentStateId = targetStateId;
    return goBack();
  }

  if (targetStateId > currentStateId) {
    log(`popstate: going FORWARD (${currentStateId} -> ${targetStateId})`);
    currentStateId = targetStateId;
    return goForward();
  }

  log(`popstate: same stateId (${targetStateId}), ignoring`);
  return 'none';
}

export function undoCount(): number {
  return undoStack.length;
}

export function redoCount(): number {
  return redoStack.length;
}
