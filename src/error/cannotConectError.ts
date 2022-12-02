import ERRORS from '../constants/ErrorCodes'; 

export class CannotConnectError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseUserNotFound() {
        return new CannotConnectError(ERRORS.CONNECT.USER_NOT_FOUND)
    }

    public static becauseMintbaseLoginFail() {
        return new CannotConnectError(ERRORS.CONNECT.MINTBASE_LOGIN)
    }

    public static becauseUnsupportedNetwork() {
        return new CannotConnectError(ERRORS.CONNECT.USUPPORTED_NETWORK)
    }
}