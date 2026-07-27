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
