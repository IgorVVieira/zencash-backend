/* eslint-disable max-params */

import { CustomApplicationError } from '@shared/errors/custom-application.error';
import { InternalServerError } from '@shared/errors/internal-server-error.error';
import { logger } from '@shared/utils/logger';

import { NextFunction, Request, Response } from 'express';

const normalizeError = (error: Error): CustomApplicationError => {
  if (error instanceof CustomApplicationError) {
    return error;
  }

  return new InternalServerError(error);
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    return next(err);
  }
  const error = normalizeError(err);
  const { statusCode } = error;
  // const body = error.getBody();

  logger.error({
    statusCode,
    message: error.message,
    stack: error?.stack,
  });

  res.status(statusCode).json({
    statusCode,
    message: 'Ocorreu um erro inesperado, tente novamente mais tarde',
  });
};
