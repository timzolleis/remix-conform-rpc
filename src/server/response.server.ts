import type { Submission } from "@conform-to/dom";
import { type InvalidSubmissionResponse, respondWithError } from "../utils/error.js";


function invalidSubmission<T>(submission: Submission<T>): InvalidSubmissionResponse<ReturnType<Submission<T>["reply"]>> {
  return respondWithError(submission.reply(), {
    code: 400,
    message: "invalid_submission",
    type: "invalid_submission"
  }) as InvalidSubmissionResponse<ReturnType<Submission<T>["reply"]>>;
}

export { invalidSubmission };
