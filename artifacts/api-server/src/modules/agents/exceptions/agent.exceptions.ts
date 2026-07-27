import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/base.exception';

export class AgentNotFoundException extends AppException {
  constructor(id: string) {
    super('AGENT_NOT_FOUND', `Agent "${id}" was not found.`, HttpStatus.NOT_FOUND);
  }
}

export class AgentLimitException extends AppException {
  constructor(limit: number) {
    super('AGENT_LIMIT_REACHED', `Your plan allows a maximum of ${limit} AI agents.`, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
