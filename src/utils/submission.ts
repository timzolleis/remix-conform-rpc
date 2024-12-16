import type { Submission } from '@conform-to/dom';

export type SuccessfulSubmission<T> = Submission<T> & {
  status: 'success';
  value: T;
};
