import ERRORS from '../constants/ErrorCodes'; 

export class CannotMint3DToken extends Error {
    public code: string;

    constructor(code: string) {
        super('Near lib error');
        this.code = code;
    }

    public static becauseMintbaseNotConnected() {
        return new CannotMint3DToken(ERRORS.MINT_3D.MINTBASE_NOT_CONNECTED)
    }

    public static becauseMintbaseError() {
        return new CannotMint3DToken(ERRORS.MINT_3D.MINTBASE_ERROR)
    }

    public static becauseContractError() {
        return new CannotMint3DToken(ERRORS.MINT_3D.CONTRACT_ERROR)
    }
}