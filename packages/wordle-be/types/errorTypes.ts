import { ErrorCode, ErrorResponse } from "@types";

export interface DuplicateKeyErrorResponse extends ErrorResponse {
  code: ErrorCode.DUPLICATE_RESOURCE;
  details: {
    field: string;
    value: any;
  };
}

export interface RateLimitErrorResponse extends ErrorResponse {
  code: ErrorCode.RATE_LIMIT_EXCEEDED;
  details: {
    retryAfter: number;
    limit: number;
    remaining: number;
  };
}

// Error code to HTTP status mapping
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.REQUIRED_FIELD_MISSING]: 400,
  [ErrorCode.GUESS_TOO_SHORT]: 400,
  [ErrorCode.GUESS_TOO_LONG]: 400,
  [ErrorCode.INVALID_GUESS]: 400,
  [ErrorCode.BAD_REQUEST]: 400,

  [ErrorCode.UNAUTHORIZED]: 401,

  [ErrorCode.FORBIDDEN]: 403,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ENDPOINT_NOT_FOUND]: 404,
  [ErrorCode.GAME_NOT_FOUND]: 404,
  [ErrorCode.PLAYER_NOT_FOUND]: 404,

  [ErrorCode.DUPLICATE_RESOURCE]: 409,

  [ErrorCode.GAME_ALREADY_COMPLETE]: 422,

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
};

// Error descriptions
export const ERROR_DESCRIPTIONS: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: "The request contains invalid data that failed validation",
  [ErrorCode.INVALID_INPUT]: "The provided input is invalid or malformed",
  [ErrorCode.REQUIRED_FIELD_MISSING]: "Required fields are missing from the request",
  [ErrorCode.GUESS_TOO_SHORT]: "Guess must be exactly 5 letters long",
  [ErrorCode.GUESS_TOO_LONG]: "Guess must be exactly 5 letters long",
  [ErrorCode.INVALID_GUESS]: "Guess contains invalid characters or format",
  [ErrorCode.BAD_REQUEST]: "Bad request",

  [ErrorCode.UNAUTHORIZED]: "Authentication is required to access this resource",

  [ErrorCode.FORBIDDEN]: "You do not have permission to access this resource",

  [ErrorCode.NOT_FOUND]: "The requested resource was not found",
  [ErrorCode.ENDPOINT_NOT_FOUND]: "The requested endpoint does not exist",
  [ErrorCode.GAME_NOT_FOUND]: "The specified game was not found",
  [ErrorCode.PLAYER_NOT_FOUND]: "The specified player was not found",

  [ErrorCode.DUPLICATE_RESOURCE]: "A resource with the same identifier already exists",

  [ErrorCode.GAME_ALREADY_COMPLETE]: "The game has already been completed",

  [ErrorCode.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded, please try again later",

  [ErrorCode.INTERNAL_SERVER_ERROR]: "An unexpected error occurred on the server",
};
