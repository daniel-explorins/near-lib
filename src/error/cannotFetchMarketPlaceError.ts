import ERRORS from '../constants/ErrorCodes'; 

export class cannotFetchMarketPlaceError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseMintbaseNotConnected() {
        return new cannotFetchMarketPlaceError(ERRORS.FETCH_MARKETPLACE.MINTBASE_NOT_CONNECTED)
    }

    public static becauseMintbaseError() {
        return new cannotFetchMarketPlaceError(ERRORS.FETCH_MARKETPLACE.MINTBASE_ERROR)
    }
}