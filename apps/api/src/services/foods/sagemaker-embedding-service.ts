import { InvokeEndpointCommand, SageMakerRuntimeClient } from '@aws-sdk/client-sagemaker-runtime';
import type { Logger } from '@intake24/common-backend';

export interface SageMakerEmbeddingServiceConfig {
  endpointName: string;
  region: string;
}

export class SageMakerEmbeddingService {
  private readonly client: SageMakerRuntimeClient;
  private readonly endpointName: string;
  private readonly logger: Logger;

  constructor(config: SageMakerEmbeddingServiceConfig, logger: Logger) {
    this.endpointName = config.endpointName;
    this.logger = logger.child({ service: 'SageMakerEmbeddingService' });
    this.client = new SageMakerRuntimeClient({ region: config.region });

    this.logger.info(`Initialized with endpoint: ${this.endpointName}`);
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  /**
   * Generate embeddings for multiple texts (batched)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      this.logger.warn('No texts provided for embedding generation');
      return [];
    }

    try {
      const startTime = Date.now();

      const command = new InvokeEndpointCommand({
        EndpointName: this.endpointName,
        ContentType: 'application/json',
        Body: JSON.stringify({ inputs: texts }),
      });

      const response = await this.client.send(command);
      const embeddings: number[][] = JSON.parse(Buffer.from(response.Body!).toString());

      const elapsedMs = Date.now() - startTime;
      this.logger.debug(
        `Generated ${embeddings.length} embeddings in ${elapsedMs}ms (${(elapsedMs / texts.length).toFixed(0)}ms per text)`,
      );

      return embeddings;
    }
    catch (error) {
      this.logger.error('Failed to generate embeddings from SageMaker:', error);
      throw error;
    }
  }
}
