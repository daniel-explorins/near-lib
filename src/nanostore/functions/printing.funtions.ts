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
export async function initPrintToken(
    token_id: string,
    nearReference: string,
    productId: string, 
    printing_fee: number,
    printerId: string,
    account?: ConnectedWalletAccount,
  ) {
    // const account = this.activeWalletConnection?.account()
    const accountId = account?.accountId

	if (!account || !accountId) throw new Error('Undefined account');

    try{
      await nanoStoreBackend.registerDepositToPrint(
        token_id,
        nearReference,
        productId,
        printing_fee.toString(),
        accountId,
        printerId
      )

    } catch (error: any) {
      console.log('Error registering print: ', error);
      return error
      // throw new Error('Error registering print: ' + error.message)
    }
    
    const amount = utils.format.parseNearAmount(printing_fee.toString());

    if(!amount) return;

    const amount_bn = toBN(amount);

    const transfer = await account.sendMoney(
        NANOSTORE_CONTRACT_NAME,
        amount_bn
    );

  }

  // TODO here we should check if the payment was done
export async function confirmPrintToken(
  token_id: string,
  nearReference: string,
  productId: string,
  transactionHashes: string, 
  account?: ConnectedWalletAccount
  ) {
  
  const accountId = account?.accountId

	if (!account || !accountId) throw new Error('Undefined account');

    // TODO: confirmation on backend
    // TODO: change type any
    try {
      await nanoStoreBackend.registerDepositPaidToPrint(token_id, nearReference, productId, accountId, transactionHashes);
    } catch (error) {

      console.log('Error confirming print: ', error);
      throw new Error('Error confirming print')
    }

    // await callToPrint(token_id);

    // Falta registrar el payment-done
        // Creamos el print-event en el backend

  }
    // @TODO Falta verificacion en frontend (Esto será en otro metodo despues del sendmoney)
    
    

export async function callToPrint(
    tokenId: string,
    nearReference: string,
    productId: string,
  ) {
    
    try {
      await nanoStoreBackend.print(tokenId, nearReference, productId);
    } catch (error) {
      console.log('print failed: ', error);
    }
    
  }