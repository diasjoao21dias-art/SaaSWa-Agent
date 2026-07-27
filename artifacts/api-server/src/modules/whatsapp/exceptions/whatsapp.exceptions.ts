import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/base.exception';

export class WhatsappNumberNotFoundException extends AppException {
  constructor(id: string) {
    super('WHATSAPP_NUMBER_NOT_FOUND', `WhatsApp number "${id}" was not found.`, HttpStatus.NOT_FOUND);
  }
}

export class WhatsappNumberLimitException extends AppException {
  constructor(limit: number) {
    super('WHATSAPP_NUMBER_LIMIT', `Your plan allows a maximum of ${limit} WhatsApp numbers.`, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class WhatsappInstanceException extends AppException {
  constructor(message: string) {
    super('WHATSAPP_INSTANCE_ERROR', message, HttpStatus.BAD_GATEWAY);
  }
}

export class WhatsappNumberNotConnectedException extends AppException {
  constructor(instanceName: string) {
    super(
      'WHATSAPP_NUMBER_NOT_CONNECTED',
      `WhatsApp instance "${instanceName}" is not connected. Please scan the QR code first.`,
      HttpStatus.CONFLICT,
    );
  }
}

export class WhatsappInvalidMessageException extends AppException {
  constructor(reason: string) {
    super('WHATSAPP_INVALID_MESSAGE', reason, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class WhatsappSendFailedException extends AppException {
  constructor(instanceName: string, cause: string) {
    super(
      'WHATSAPP_SEND_FAILED',
      `Failed to send message via "${instanceName}": ${cause}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}
