import ERRORS from '../constants/ErrorCodes'; 

export class cannotGetMintersError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseMintbaseNotConnected() {
        return new cannotGetMintersError(ERRORS.GET_MINTERS.MINTBASE_NOT_CONNECTED)
    }

    public static becauseMintbaseError() {
        return new cannotGetMintersError(ERRORS.GET_MINTERS.MINTBASE_ERROR)
    }

    public static becauseContractError() {
        return new cannotGetMintersError(ERRORS.GET_MINTERS.CONTRACT_ERROR)
    }
}