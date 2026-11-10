import { once } from 'node:events';

import puppeteer from 'puppeteer';

import { FeedbackPdfGenerator } from '@intake24/api/services/feedback';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

function mockBrowser(goto: () => Promise<unknown> = async () => null) {
  const page = {
    emulateMediaType: vi.fn(),
    evaluateOnNewDocument: vi.fn(),
    goto: vi.fn(goto),
    createPDFStream: vi.fn(async () => new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1]));
        controller.close();
      },
    })),
  };
  const browser = {
    setCookie: vi.fn(),
    newPage: vi.fn(async () => page),
    close: vi.fn(async () => {}),
  };
  vi.mocked(puppeteer.launch).mockResolvedValue(browser as any);

  return browser;
}

function createGenerator() {
  return new FeedbackPdfGenerator('http://localhost/feedback', { name: 'token', value: 'value', domain: 'localhost' }, { headless: true });
}

describe('feedbackPdfGenerator', () => {
  it('closes the browser and throws AbortError when aborted during page load', async () => {
    let rejectGoto!: (error: Error) => void;
    const browser = mockBrowser(() => new Promise((_, reject) => {
      rejectGoto = reject;
    }));
    browser.close.mockImplementation(async () => rejectGoto(new Error('Target closed')));
    const abortController = new AbortController();

    const pdf = createGenerator().getPdfStream(abortController.signal);
    await vi.waitFor(() => expect(rejectGoto).toBeDefined());
    abortController.abort();

    await expect(pdf).rejects.toThrow(expect.objectContaining({ name: 'AbortError' }));
    expect(browser.close).toHaveBeenCalledOnce();
  });

  it('closes the browser once when the stream finishes', async () => {
    const browser = mockBrowser();
    const abortController = new AbortController();

    const stream = await createGenerator().getPdfStream(abortController.signal);
    stream.resume();
    await once(stream, 'close');
    abortController.abort();

    expect(browser.close).toHaveBeenCalledOnce();
  });

  it('closes the browser when aborted while the stream is not consumed', async () => {
    const browser = mockBrowser();
    const abortController = new AbortController();

    await createGenerator().getPdfStream(abortController.signal);
    abortController.abort();

    expect(browser.close).toHaveBeenCalledOnce();
  });

  it('does not launch a browser when already aborted', async () => {
    mockBrowser();

    await expect(createGenerator().getPdfStream(AbortSignal.abort())).rejects.toThrow();
    expect(puppeteer.launch).not.toHaveBeenCalled();
  });
});
