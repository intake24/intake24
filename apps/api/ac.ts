import { faker } from '@faker-js/faker';
import ac from 'autocannon';

/* ac({
  url: 'http://localhost:3000',
  connections: 10, // default
  pipelining: 1, // default
  duration: 10, // default
}, console.log); */

// async/await
async function foo() {
  const ar = Array.from({ length: 100 });
  for (let i = 0; i < ar.length; i++) {
    const randomSearchString = faker.lorem.words(2);
    const urlEncoded = encodeURIComponent(randomSearchString);
    console.log(urlEncoded);
    const instance = await ac({
      url: `https://localhost:3100/api/surveys/beta/search?description=${randomSearchString}&recipe=false&hidden=false`,
      // url: 'https://localhost:3100/api/ping',
      connections: 10, // default
      pipelining: 1, // default
      duration: 2, // default
    /* setupClient: (client) => {
      const randomSearchString = encodeURIComponent(faker.lorem.words(1));
      client.setRequest({
        method: 'GET',
        path: `https://localhost:3100/api/surveys/beta/search?description=${randomSearchString}&recipe=false&hidden=false`,
      });
    }, */
    });
    console.log(instance);
    console.log(`done`, i + 1);
  }

  /* instance.on('done', handleResults);

  instance.on('tick', () => console.log('ticking'));

  instance.on('response', handleResponse);

  function setupClient(client) {
    client.on('body', console.log); // console.log a response body when its received
  }

  function handleResponse(client, statusCode, resBytes, responseTime) {
    console.log(`Got response with code ${statusCode} in ${responseTime} milliseconds`);
    console.log(`response: ${resBytes.toString()}`);

    // update the body or headers
    client.setHeaders({ new: 'header' });
    client.setBody('new body');
    client.setHeadersAndBody({ new: 'header' }, 'new body');
  }

  function handleResults(result) {
    console.log(result);
  } */
}

foo().then(() => {
  console.log('done');
}).catch((err) => {
  console.error(err);
});
