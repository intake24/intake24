import type { CommsList, CommsProvider, SubscribeInput } from './comms';
import ky from 'ky';
import type { IoC } from '@intake24/api/ioc';

export interface CreateSubscriber {
  salutation?: string;
  first_name?: string;
  surname?: string;
  company?: string;
  ref?: string;
  email: string;
  mobile?: string;
  tags?: string;
  custom_fields?: Record<string, string> | [];
  list: string;
}

export interface UpdateSubscriber extends Partial<CreateSubscriber> {
  status: 'active' | 'inactive' | 'unsubscribed' | 'bounced';
};

export interface SearchResponseItem {
  id: number;
  salutation: string;
  first_name: string;
  surname: string;
  company: string;
  ref: string;
  email: string;
  mobile: string;
  custom_fields: Record<string, string> | [];
  list: string;
  list_name: string;
  subscribe: string;
  subscribe_date: string;
  tags: string;
  status: 'active' | 'inactive' | 'unsubscribed' | 'bounced';
}

export interface SearchResponse {
  status: 'ok';
  matches: SearchResponseItem[];
}

function mapToCreateSubscriber(list: string, input: SubscribeInput): CreateSubscriber {
  const { email, name } = input;
  const nameSegments = name?.split(' ') ?? [];
  const surname = nameSegments.pop();
  const firstName = nameSegments.join(' ');

  return {
    email,
    first_name: firstName,
    surname,
    list,
  };
}

function emailBlaster({ logger: globalLogger, servicesConfig }: Pick<IoC, 'servicesConfig' | 'logger'>): CommsProvider {
  const { url, apiKey, lists } = servicesConfig.comms['email-blaster'];
  const logger = globalLogger.child({ service: 'EmailBlaster' });

  const client = ky.create({
    prefixUrl: url,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      api_key: apiKey,
    },
  });

  async function search(list: CommsList, email: string) {
    const data = await client<SearchResponse>('subscriber/search', {
      method: 'POST',
      json: { search_string: email },
    }).json();

    return data.matches.find(item => item.list === lists[list]);
  }

  async function createSubscriber(list: CommsList, input: Omit<CreateSubscriber, 'list'>) {
    await client('subscriber/subscribe', {
      method: 'POST',
      json: { ...input, list: lists[list] },
    }).json();
  }

  async function updateSubscriber(subscriberId: string, input: Omit<CreateSubscriber, 'list'>) {
    await client(`subscriber/update/${subscriberId}`, {
      method: 'PATCH',
      json: { ...input, status: 'active' },
    }).json();
  }

  function needsUpdating(subscriber: SearchResponseItem, input: Omit<CreateSubscriber, 'list'>) {
    for (const [key, value] of Object.entries(input)) {
      if (subscriber[key as keyof Omit<CreateSubscriber, 'list'>] !== value)
        return true;
    }
    return false;
  }

  async function subscribe(list: CommsList, input: SubscribeInput) {
    const ebInput = mapToCreateSubscriber(lists[list], input);

    search(list, ebInput.email).then((subscriber) => {
      if (!subscriber) {
        createSubscriber(list, ebInput).catch((error) => {
          logger.error('Failed to create subscriber:', { error });
        });
        return;
      }

      if (subscriber.status !== 'active' || needsUpdating(subscriber, ebInput)) {
        updateSubscriber(subscriber.id.toString(), ebInput).catch((error) => {
          logger.error('Failed to update subscriber:', { error });
        });
      }
    }).catch((error) => {
      logger.error('Failed to search for subscriber:', { error });
    });
  }

  return { subscribe };
}

export default emailBlaster;

export type EmailBlaster = ReturnType<typeof emailBlaster>;
