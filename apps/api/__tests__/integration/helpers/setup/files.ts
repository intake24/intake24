import { generateCSV, generateImage } from '../util';

export type MockFiles = {
  data: {
    csv: string;
  };
  images: {
    jpg: string;
  };
};

export async function initFiles(): Promise<MockFiles> {
  const jpg = await generateImage('mockImage.jpg');
  const csv = await generateCSV('uploadRespondents.csv');

  return {
    data: { csv },
    images: { jpg },
  };
}
