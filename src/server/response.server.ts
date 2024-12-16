import { data } from '@remix-run/server-runtime';
import type { Submission } from '@conform-to/dom';

function errorResponse<T>({
  submission,
  error,
  status
}: {
  submission?: Submission<T>;
  error: unknown;
  status?: number;
}) {
  return data({
    result: submission?.reply(),
    status: 'error',
    error: error,
    code: status ?? 500
  });
}

function invalidSubmission<T>(submission: Submission<T>) {
  return errorResponse({
    submission,
    error: 'invalid_submission',
    status: 400
  });
}

export { errorResponse, invalidSubmission };
