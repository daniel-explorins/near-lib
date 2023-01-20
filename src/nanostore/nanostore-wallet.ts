import { Contract, ConnectedWalletAccount } from "near-api-js";
import { 
  MAX_GAS,
  ONE_YOCTO,
  STORE_CONTRACT_CALL_METHODS,
  STORE_CONTRACT_VIEW_METHODS,
  TWENTY_FOUR } from "./../constants";
import { NANOSTORE_CONTRACT_NAME } from "./constants";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class NanostoreWallet {

    private nanosToreWalletConfig: any;

    public constructor(  ) {
       
    }

    /**
     * @description
     * ------------------------------------------------------------------------------------
     * @param {ConnectedWalletAccount} account
     * @returns 
     */
    public async getStoreMinters(account: ConnectedWalletAccount) {
      try {
        const contract = new Contract(
          account, 
          NANOSTORE_CONTRACT_NAME,
          {
            viewMethods: STORE_CONTRACT_VIEW_METHODS,
            changeMethods: STORE_CONTRACT_CALL_METHODS
          }
        );
        
        const minters = await contract.list_minters();
        return minters;
        
      } catch (error) {
        console.log('a error ocurred !');
      }
    }

    /**
     * @description Mint an nft that could be 3d printed
     * ------------------------------------------------------------------------------------
     * @param {ConnectedWalletAccount} account
     */
    public async mintNft(account: ConnectedWalletAccount): Promise<void> {
      try {
        const contract = new Contract(
          account, 
          NANOSTORE_CONTRACT_NAME,
          {
            viewMethods: STORE_CONTRACT_VIEW_METHODS,
            changeMethods: STORE_CONTRACT_CALL_METHODS
          }
        );
        
        await contract.batch_mint();
        
      } catch (error) {
        console.log('a error ocurred !');
      }
    }

 
}