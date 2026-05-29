export interface ErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors?: FieldError[];
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface FieldError {
  field: string;
  message: string;
}
