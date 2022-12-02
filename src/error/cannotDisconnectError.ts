import ERRORS from '../constants/ErrorCodes'; 

export class CannotDisconnectError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseAccountNotFound() {
        return new CannotDisconnectError(ERRORS.TRANSFER_TOKEN.ACCOUNT_NOT_FOUND)
    }
}
