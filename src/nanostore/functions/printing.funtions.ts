import { NANOSTORE_CONTRACT_NAME } from "../constants";
import { connect as nearConnect, ConnectedWalletAccount, utils } from "near-api-js";
import { toBN } from "./../../utils/helpers";
import { NanostoreBackend } from "../nanostore.backend";

const nanoStoreBackend = new NanostoreBackend();

/**
   * @description call nft_deposit_print on contract
   * -----------<s---------------------------------------------------
   * @param token_id 
   * @param printing_fee 
   */
export async function depositToPrint(
    token_id: number, 
    printing_fee: number,
    printerId: string,
    account?: ConnectedWalletAccount,
  ) {
    // const account = this.activeWalletConnection?.account()
    const accountId = account?.accountId

	if (!account || !accountId) throw new Error('Undefined account');

    await nanoStoreBackend.registerDepositToPrint(
        token_id.toString(),
        printing_fee.toString(),
        accountId,
        printerId
    )

    const amount = utils.format.parseNearAmount(printing_fee.toString());

    if(!amount) return;

    const amount_bn = toBN(amount);

    // @TODO Falta verificacion en frontend (Esto será en otro metodo despues del sendmoney)
    
    await nanoStoreBackend.registerDepositPayedToPrint(token_id.toString());

    // Esto será un paso posterior
    this.callToPrint(token_id.toString());

    const transfer = await account.sendMoney(
        NANOSTORE_CONTRACT_NAME,
        amount_bn
    );

    // Falta registrar el payment-done
        // Creamos el print-event en el backend
}

export async function callToPrint(
    tokenId: string
  ) {
    
    try {
      await nanoStoreBackend.print(tokenId);
    } catch (error) {
      console.log('ha fallado el print: ', error);
    }
    
  }