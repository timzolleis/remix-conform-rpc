import type { Submission } from "@conform-to/dom";

type RespondWithErrorOptions = {
  code?: number;
  message?: string;
  type?: "error" | "invalid_submission";
};

function respondWithError<TResponse>(responseData: TResponse, options?: RespondWithErrorOptions): ErrorResponse<TResponse> | InvalidSubmissionResponse<ReturnType<Submission<TResponse>["reply"]>> {
  return {
    status: "error" as const,
    code: options?.code ?? 500,
    result: responseData,
    type: options?.type ?? "error" as const,
    ...options
  } as ErrorResponse<TResponse> | InvalidSubmissionResponse<ReturnType<Submission<TResponse>["reply"]>>;
}

type ErrorResponse<TResult> = {
  status: "error";
  type: "error"
  result: TResult;
  code: number;
  message?: string;
};

type InvalidSubmissionResponse<TResponse> = {
  status: "error",
  type: "invalid_submission",
  result: TResponse,
  code: number;
  message?: string;
}


function isErrorResponse<TData>(response: any): response is ErrorResponse<TData> {
  return response !== null && "status" in response && response.status === "error";
}


export { respondWithError, isErrorResponse };
export type { ErrorResponse, InvalidSubmissionResponse };
