import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/base.exception';

export class ConversationNotFoundException extends AppException {
  constructor(id: string) {
    super('CONVERSATION_NOT_FOUND', `Conversation "${id}" was not found.`, HttpStatus.NOT_FOUND);
  }
}

export class ConversationAlreadyClosedException extends AppException {
  constructor() {
    super('CONVERSATION_ALREADY_CLOSED', 'This conversation is already closed.', HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
