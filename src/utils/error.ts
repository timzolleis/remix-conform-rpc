import { data } from '@remix-run/server-runtime';

type RespondWithErrorOptions = {
  status?: number;
  message?: string;
};

function respondWithError<TResponse>(responseData?: TResponse, options?: RespondWithErrorOptions) {
  return data({
    status: 'error',
    code: options?.status ?? 500,
    result: responseData,
    ...options
  });
}

type ErrorResponse<TResult> = {
  status: 'error';
  result: TResult;
  code: number;
  message?: string;
};

function isErrorResponse<TData>(response: any): response is ErrorResponse<TData> {
  return response !== null && 'status' in response && response.status === 'error';
}

export { respondWithError, isErrorResponse, ErrorResponse };
