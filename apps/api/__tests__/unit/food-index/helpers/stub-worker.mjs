/*
 * Stub index builder worker.
 *
 * Speaks the same message protocol as the real worker but holds no index and touches no database. It is a
 * relay: every request FoodIndex posts is forwarded to the test over a side channel, and the test decides
 * exactly what, and when, to post back. That keeps tests deterministic while still exercising a real worker
 * thread and real structured cloning.
 *
 * Plain JavaScript because a worker entry point is not run through the test runner's TypeScript transform.
 * It deliberately knows nothing about the protocol so that all payloads stay typed in the test file.
 */
import { parentPort, workerData } from 'node:worker_threads';

if (workerData?.scenario === 'crashOnBoot')
  throw new Error('simulated fatal bootstrap failure');

const control = workerData.controlPort;

// Requests from FoodIndex, in the order the worker receives them.
parentPort.on('message', (request) => {
  control.postMessage({ type: 'request', request });
});

// Commands from the test.
control.on('message', (command) => {
  switch (command.type) {
    case 'respond':
      parentPort.postMessage(command.response);
      break;

    case 'crash':
      // Thrown asynchronously so it surfaces as an 'error' event on the parent.
      throw new Error(command.message);

    case 'exit':
      process.exit(command.code ?? 0);
      break;

    default:
      control.postMessage({ type: 'error', message: `Unknown stub command: ${command.type}` });
  }
});

control.postMessage({ type: 'booted' });
