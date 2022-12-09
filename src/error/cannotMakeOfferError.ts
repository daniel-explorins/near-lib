import ERRORS from '../constants/ErrorCodes'; 

export class cannotMakeOfferError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseUserNotFound() {
        return new cannotMakeOfferError(ERRORS.MAKE_OFFER.USER_NOT_FOUND)
    }

    public static becauseTokenNotFound() {
        return new cannotMakeOfferError(ERRORS.MAKE_OFFER.TOKEN_NOT_FOUND)
    }

    public static becauseStoreNotFound() {
        return new cannotMakeOfferError(ERRORS.MAKE_OFFER.STORE_NOT_FOUND)
    }

    public static becauseMintbaseError() {
        return new cannotMakeOfferError(ERRORS.MAKE_OFFER.MINTBASE_ERROR)
    }

    public static becauseMintbaseNotConnected() {
        return new cannotMakeOfferError(ERRORS.MAKE_OFFER.MINTBASE_NOT_CONNECTED)
    }
}