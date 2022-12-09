import ERRORS from '../constants/ErrorCodes'; 

export class cannotFetchStoreError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseMintbaseNotConnected() {
        return new cannotFetchStoreError(ERRORS.FETCH_STORE.MINTBASE_NOT_CONNECTED)
    }

    public static becauseMintbaseError() {
        return new cannotFetchStoreError(ERRORS.FETCH_STORE.MINTBASE_ERROR)
    }
}
