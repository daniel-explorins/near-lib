import ERRORS from '../constants/ErrorCodes'; 

export class CannotDisconnectError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseMintbaseError() {
        return new CannotDisconnectError(ERRORS.DISCONNECT.MINTBASE_ERROR)
    }
}
