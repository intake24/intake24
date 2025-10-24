export type CommsProviderType = 'email-blaster';
export type CommsList = 'newsletter' | 'support';

export type CommsProvider = {
  subscribe: (list: CommsList, input: SubscribeInput) => Promise<void>;
};

export type SubscribeInput = {
  email: string;
  name?: string;
};
