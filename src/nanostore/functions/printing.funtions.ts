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
export async function printToken(
    token_id: string, 
    printing_fee: number,
    printerId: string,
    account?: ConnectedWalletAccount,
  ) {
    // const account = this.activeWalletConnection?.account()
    const accountId = account?.accountId

	if (!account || !accountId) throw new Error('Undefined account');

    await nanoStoreBackend.registerDepositToPrint(
        token_id,
        printing_fee.toString(),
        accountId,
        printerId
    )

    const amount = utils.format.parseNearAmount(printing_fee.toString());

    if(!amount) return;

    const amount_bn = toBN(amount);

    const transfer = await account.sendMoney(
        NANOSTORE_CONTRACT_NAME,
        amount_bn
    );

  }

  // TODO here we should check if the payment was done
export async function confirmPrint(token_id: string) {

    // TODO: confirmation on backend
    // TODO: change type any
    const confirmation: any = await nanoStoreBackend.registerDepositPayedToPrint(token_id.toString());

    if(!confirmation) throw new Error('Error confirming print');
    // console.log('transfer: ', transfer)
    
    // TODO remove this
    // return 
    // Esto será un paso posterior
    await callToPrint(token_id);

    // Falta registrar el payment-done
        // Creamos el print-event en el backend

  }
    // @TODO Falta verificacion en frontend (Esto será en otro metodo despues del sendmoney)
    
    

export async function callToPrint(
    tokenId: string
  ) {
    
    try {
      await nanoStoreBackend.print(tokenId);
    } catch (error) {
      console.log('ha fallado el print: ', error);
    }
    
  }