import feedback from './feedback/index.test';
import getPhysicalData from './get-physical-data.test';
import password from './password.test';
import setPhysicalData from './set-physical-data.test';
import submissions from './submissions.test';

export default () => {
  describe('get /api/user/physical-data', getPhysicalData);
  describe('post /api/user/physical-data', setPhysicalData);
  describe('get /api/user/submissions', submissions);
  describe('get /api/user/password', password);
  describe('/api/user/feedback', feedback);
};
