import ERRORS from '../constants/ErrorCodes'; 

export class CannotGetContractError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseUserNotFound() {
        return new CannotGetContractError(ERRORS.CONTRACT.USER_NOT_FOUND)
    }

    public static becauseMintbaseNotConnected() {
        return new CannotGetContractError(ERRORS.CONTRACT.MINTBASE_NOT_CONNECTED)
    }

    public static becauseMintbaseError() {
        return new CannotGetContractError(ERRORS.CONTRACT.MINTBASE_ERROR)
    }

    public static becauseContractNameNotFound() {
        return new CannotGetContractError(ERRORS.CONTRACT.CONTRACT_NAME_NOT_FOUND)
    }

    public static becauseNearError() {
        return new CannotGetContractError(ERRORS.CONTRACT.NEAR_ERROR)
    }
}