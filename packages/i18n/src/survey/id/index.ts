import common from './common.json';
import profile from './profile.json';
import recall from './recall.json';
import survey from './survey.json';

const messages = {
  common,
  profile,
  recall,
  survey,
};

export type MessageSchema = typeof messages;

export default messages;
