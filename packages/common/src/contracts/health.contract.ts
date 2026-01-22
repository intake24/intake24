import { initContract } from '@ts-rest/core';

const contract = initContract();

export const health = contract.router({
  ping: {
    method: 'GET',
    path: '/ping',
    responses: {
      200: contract.noBody(),
    },
    summary: 'Ping',
    description: 'Send ping to the server to check if it is up and running.',
  },
});
