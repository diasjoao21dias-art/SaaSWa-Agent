import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Swagger decorator for paginated responses.
 * Wraps the given DTO in the standard PaginatedResponseDto envelope.
 *
 * @example
 * @ApiPaginatedResponse(ConversationResponseDto)
 * @Get()
 * findAll() { ... }
 */
export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 20 },
                  total: { type: 'number', example: 150 },
                  totalPages: { type: 'number', example: 8 },
                },
              },
            },
          },
        ],
      },
    }),
  );
};
