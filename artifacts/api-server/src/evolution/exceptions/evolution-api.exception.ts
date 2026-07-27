import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/base.exception';

/**
 * Lançada quando a Evolution API retorna um erro ou está inacessível.
 * É uma exceção de infraestrutura — não contém regras de negócio.
 */
export class EvolutionApiException extends AppException {
  constructor(operation: string, cause: string, statusCode: HttpStatus = HttpStatus.BAD_GATEWAY) {
    super(
      'EVOLUTION_API_ERROR',
      `Evolution API error during "${operation}": ${cause}`,
      statusCode,
    );
  }
}

export class EvolutionInstanceNotFoundException extends AppException {
  constructor(instanceName: string) {
    super(
      'EVOLUTION_INSTANCE_NOT_FOUND',
      `Evolution API instance "${instanceName}" was not found.`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class EvolutionConnectionRefusedException extends AppException {
  constructor(instanceName: string) {
    super(
      'EVOLUTION_CONNECTION_REFUSED',
      `Evolution API instance "${instanceName}" refused the connection.`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
