import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/base.exception';

export class CustomerNotFoundException extends AppException {
  constructor(id: string) {
    super('CUSTOMER_NOT_FOUND', `Customer "${id}" was not found.`, HttpStatus.NOT_FOUND);
  }
}

export class CustomerAlreadyExistsException extends AppException {
  constructor(phone: string) {
    super('CUSTOMER_ALREADY_EXISTS', `A customer with phone "${phone}" already exists.`, HttpStatus.CONFLICT);
  }
}
