import ERRORS from '../constants/ErrorCodes'; 

export class CannotTransferTokenError extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseAccountNotFound() {
        return new CannotTransferTokenError(ERRORS.TRANSFER_TOKEN.ACCOUNT_NOT_FOUND);
    }

    public static becauseContractNotFound() {
        return new CannotTransferTokenError(ERRORS.TRANSFER_TOKEN.CONTRACT_NOT_FOUND);
    }

    public static becauseTransactionFails() {
        return new CannotTransferTokenError(ERRORS.TRANSFER_TOKEN.TRANSACTION_FAILS);
    }
}
