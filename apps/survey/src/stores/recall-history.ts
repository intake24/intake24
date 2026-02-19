import type { SurveyStore } from './survey';
import type { ComponentType } from '@intake24/common/prompts';
import type { SurveyState as CurrentSurveyState } from '@intake24/common/surveys';

import { toRaw } from 'vue';

import { copy } from '@intake24/common/util';

import { getOrCreatePromptStateStore, promptStores } from './prompt';

/*
  History system design goals:

  1) A catch-all implementation that does something reasonable on back/forward buttons
     (even if it is not great UX) and automatically handles all prompt logic without requiring
     prompts to be aware of the history system.

  2) Support for "typical prompt flow" that offers better UX by preserving the pre-commit internal prompt
     state when going back. E.g., meal-edit-prompt should "uncommit" entered foods from the survey state but
     keep them in the prompt UI.

     This also should not require any custom code in the prompts, but it relies on prompts using prompt
     stores to preserve their internal state. If the prompt has internal state but does not save it in a prompt
     store, we lose the state but the back/forward buttons still work.

  3) Optional support for mid-prompt history states (e.g., when switching panels in a multi-stage prompt).

     This is dependent on the internal prompt logic and requires custom calls to the history system.

  To support 3, there are two types of history entries:

  - FullHistoryEntry: complete survey state + all prompt store snapshots. Automatically
    created at prompt boundaries. When restored, triggers re-evaluation of the current prompt.

  - PromptHistoryEntry: lightweight snapshot of a single prompt's local state. Can optionally be used
    for mid-prompt checkpoints. When restored, does not remount or re-evaluate the current prompt.

  In order to meet goals 1 and 2, full entries are pushed in two ways:

  Explicit push: prompt handlers call pushFullHistoryEntry() before committing an answer, capturing
  the pre-commit state (used by standard handlers via use-prompt-handler-store and for direct survey
  mutations such as deleteMeal).

  Fallback push: recall-mixin calls createFallbackHistoryEntry() each time a new prompt is displayed,
  then maybePushFallbackHistoryEntry() when next() is called. If the current prompt handler does an explicit
  push, it clears fallbackEntry and the fallback push is skipped.

  This ensures non-standard handlers that commit before emitting 'next' (e.g. FoodSearchPromptHandler) are
  still covered.

  In order to meet goal 3, prompts that support mid-prompt history call registerPromptHistoryHandler and
  unregisterPromptHistoryHandler on mount/unmount correspondingly. This lets the history system query and
  restore internal prompt state directly. Accessing current prompt state via component tree would otherwise be
  complicated.

  Note about mid-prompt states: because there is always a FullHistoryEntry on prompt boundaries, a
  PromptHistoryEntry cannot be reached in the undo stack without the corresponding prompt component
  already having been mounted and its callbacks registered. This means there is no need for explicit
  checks for the prompt component type.
*/

const DEBUG_RECALL_HISTORY: boolean = false;
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
let fallbackEntry: FullHistoryEntry | null = null;

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
  if (DEBUG_RECALL_HISTORY)
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

/*
  Note: Vue router is interfering with popstate calls, there is some internal logic to correct
  "failed" navigation events resulting in confusing spurious popstate calls when the history
  entries are not what Vue router expects.

  This can be observed by monkey patching history.go like this (can be down in browser console):

  const baseGo = history.go.bind(history);
  history.go = function(...args) {
    console.trace('history.go called with', args);
    return baseGo(...args);
  };

  Copying Vue's internal fields from history.state to our history entries seems to resolve the
  issue, but feels hacky. Not clear if there is a better solution.
*/

export function initRecallHistory(store: SurveyStore) {
  survey = store;
  undoStack.length = 0;
  redoStack.length = 0;
  currentStateId = 0;
  fallbackEntry = null;

  history.replaceState({ ...history.state, recallHistory: true, stateId: currentStateId }, '', window.location.href);
  log(`init | stateId=${currentStateId}`);
}

export function destroyRecallHistory() {
  log('destroy');
  survey = null;
  undoStack.length = 0;
  redoStack.length = 0;
  fallbackEntry = null;
}

function commitEntryToUndoStack(entry: RecallHistoryEntry, label: string) {
  if (undoStack.length >= MAX_UNDO_STACK) {
    const dropped = undoStack.shift();
    log(`dropped oldest entry: "${dropped?.description}"`);
  }

  undoStack.push(entry);
  invalidateForward();

  ++currentStateId;
  history.pushState({ ...history.state, recallHistory: true, stateId: currentStateId }, '', window.location.href);

  logStacks(`after ${label}`);
}

export function createFallbackHistoryEntry(description: string) {
  fallbackEntry = createFullHistoryEntry(description);
  log(`createFallbackHistoryEntry: "${description}"`);
}

export function maybePushFallbackHistoryEntry() {
  if (!fallbackEntry) {
    log('maybePushFallbackHistoryEntry: fallback entry cleared, skipping');
    return;
  }

  log(`maybePushFallbackHistoryEntry: "${fallbackEntry.description}" | stateId before=${currentStateId}`);
  const entry = fallbackEntry;
  fallbackEntry = null;
  commitEntryToUndoStack(entry, 'maybePushFallbackHistoryEntry');
}

export function pushFullHistoryEntry(description: string) {
  if (!survey) {
    console.error('Recall history not initialised, cannot push state');
    return;
  }

  fallbackEntry = null;
  log(`pushFullHistoryEntry: "${description}" | stateId before=${currentStateId}`);
  commitEntryToUndoStack(createFullHistoryEntry(description), 'pushFullHistoryEntry');
}

export function pushPromptHistoryEntry(description: string) {
  if (!survey) {
    console.error('[recall-history] not initialised, cannot save state');
    return;
  }

  log(`pushPromptHistoryEntry: "${description}" | stateId before=${currentStateId}`);
  const entry = createPromptHistoryEntry(description);
  if (entry != null)
    commitEntryToUndoStack(entry, 'pushPromptHistoryEntry');
}

export function invalidateForward() {
  if (redoStack.length) {
    log(`invalidateForward: clearing ${redoStack.length} redo entries`);
    redoStack.length = 0;
  }
}

export function goBack(): HandlePopStateResult {
  log(`goBack called | undoStack.length=${undoStack.length}`);
  fallbackEntry = null;

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
  fallbackEntry = null;

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
