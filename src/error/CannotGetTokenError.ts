import ERRORS from '../constants/ErrorCodes'; 

export class CannotGetTokenError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseMintbaseNotConnected() {
        return new CannotGetTokenError(ERRORS.GET_TOKEN.MINTBASE_NOT_CONNECTED)
    }

    public static becauseTimeoutError() {
        return new CannotGetTokenError(ERRORS.GET_TOKEN.TIMEOUT_ERROR)
    }
}