import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/base.exception';

/**
 * Lançada quando a OpenAI API retorna erro ou está inacessível.
 * Exceção de infraestrutura — não expõe lógica de negócio.
 */
export class OpenAiApiException extends AppException {
  constructor(operation: string, cause: string) {
    super(
      'OPENAI_API_ERROR',
      `OpenAI API error during "${operation}": ${cause}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class OpenAiRateLimitException extends AppException {
  constructor() {
    super(
      'OPENAI_RATE_LIMIT',
      'OpenAI rate limit reached. Please try again in a moment.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class OpenAiContextLengthException extends AppException {
  constructor(model: string) {
    super(
      'OPENAI_CONTEXT_LENGTH',
      `Message history exceeds the context window for model "${model}". Please reduce the conversation history.`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
