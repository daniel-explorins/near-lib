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
    public async printableNftMint(account: ConnectedWalletAccount): Promise<void> {
      try {
        const contract = new Contract(
          account, 
          NANOSTORE_CONTRACT_NAME,
          {
            viewMethods: STORE_CONTRACT_VIEW_METHODS,
            changeMethods: STORE_CONTRACT_CALL_METHODS
          }
        );
        
        await contract.nft_batch_mint({
          meta: null,
          callbackUrl: "",
          args: {
            "owner_id": "nanostore.eurega.testnet",
            "metadata": {
              "title":"nanostore prueba 2",
              "description":"nanostore prueba1 description"
            },
            "royalty_args": null,
            "num_to_mint":3
          },
          gas: MAX_GAS,
          amount: ONE_YOCTO,
        });
        
      } catch (error) {
        console.log('a error ocurred !', error);
      }
    }

 
}