import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/base.exception';

export class InvalidCredentialsException extends AppException {
  constructor() {
    super(
      'INVALID_CREDENTIALS',
      'The email or password you entered is incorrect.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AccountInactiveException extends AppException {
  constructor() {
    super(
      'ACCOUNT_INACTIVE',
      'Your account is inactive. Please contact your administrator.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class EmailNotVerifiedException extends AppException {
  constructor() {
    super(
      'EMAIL_NOT_VERIFIED',
      'Please verify your email address before logging in.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TokenRevokedException extends AppException {
  constructor() {
    super(
      'TOKEN_REVOKED',
      'This token has been revoked. Please log in again.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class TokenExpiredException extends AppException {
  constructor() {
    super(
      'TOKEN_EXPIRED',
      'Your session has expired. Please log in again.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
