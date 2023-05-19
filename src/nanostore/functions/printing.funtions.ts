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
    contractId: string,
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
    }
    
    const amount = utils.format.parseNearAmount(printing_fee.toString());

    if(!amount) return;

    const amount_bn = toBN(amount);

    const transfer = await account.sendMoney(
      contractId,
      amount_bn
    );

  }

/**
 * @description confirm print token
 * @param token_id 
 * @param nearReference 
 * @param productId 
 * @param transactionHashes 
 * @param account 
 */
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

  }

  /**
   * @description call nft_print on contract
   * -----------<s---------------------------------------------------
   * @param token_id
   * @param nearReference
   * @param productId
   * @param account
    */
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