import { isErrorResponse } from '../src/utils/error';
import { it, describe, expect } from 'vitest';

describe('it should classify responses as error or not', () => {
  it('should classify as error response', () => {
    const response = {
      status: 'error'
    };
    expect(isErrorResponse(response)).toBe(true);
  });
  it('should classify as not error response', () => {
    const response = {
      status: 'success'
    };
    expect(isErrorResponse(response)).toBe(false);
  });
  it('should classify a user object as not error response', () => {
    const response = {
      user: {
        name: 'John Doe'
      }
    };
    expect(isErrorResponse(response)).toBe(false);
  });
});
