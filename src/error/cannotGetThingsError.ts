import ERRORS from '../constants/ErrorCodes'; 

export class cannotGetThingsError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseMintbaseNotConnected() {
        return new cannotGetThingsError(ERRORS.FETCH_THINGS.MINTBASE_NOT_CONNECTED)
    }

    public static becauseMintbaseError() {
        return new cannotGetThingsError(ERRORS.FETCH_THINGS.MINTBASE_ERROR)
    }
}