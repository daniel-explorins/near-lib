import { cannotMakeOfferError } from "./../../error/cannotMakeOfferError";
import { MARKETPLACE_HOST_NEAR_ACCOUNT, MINTBASE_MARKET_CONTRACT_CALL_METHODS, MINTBASE_MARKET_CONTRACT_VIEW_METHODS } from "./../../mintbase/constants";
import { connect as nearConnect, ConnectedWalletAccount, Contract, Near, utils, WalletConnection } from "near-api-js";
import { NANOSTORE_CONTRACT_NAME } from "../constants";
import { MAX_GAS } from "./../../constants";
import { NearTransaction, OptionalMethodArgs } from "./../../types";
import { JsonToUint8Array, calculateListCost, toBN } from "./../../utils/helpers";
import { Action, createTransaction, functionCall } from "near-api-js/lib/transaction";
import { base_decode } from "near-api-js/lib/utils/serialize";
import { PublicKey } from "near-api-js/lib/utils"; 

const elliptic = require("elliptic").ec;

/**
   * @description Purchase a token
   * ------------------------------------------------------------------------------------
   * @param token_id
   * @param price
   * @param account
*/
export async function purchaseToken(token_id: string, price: string, account?: ConnectedWalletAccount) {

    const accountId = account?.accountId
    const gas = MAX_GAS;

    if (!account || !accountId) throw cannotMakeOfferError.becauseUserNotFound();

    // Mitbase market connection
    const contract = new Contract(
      account,
      MARKETPLACE_HOST_NEAR_ACCOUNT,
      {
        viewMethods:
            MINTBASE_MARKET_CONTRACT_VIEW_METHODS,
        changeMethods:
            MINTBASE_MARKET_CONTRACT_CALL_METHODS,
      }
    )
    try {
      const amount = utils.format.parseNearAmount(price)
        // @ts-ignore: method does not exist on Contract type
        await contract.buy({
            args: {
              // TODO: open for other token
              nft_contract_id: NANOSTORE_CONTRACT_NAME, //  'nanostore_store.dev-1675363616907-84002391197707',
              token_id
            },
            gas,
            amount: amount, // attached deposit in yoctoNEAR
        })
    } catch (error) {
        console.log('error: ', error)
        throw cannotMakeOfferError.becauseMintbaseError();
    }
  }

  /**
   * @description List a token for sale
   * ------------------------------------------------------------------------------------
   * @param tokenId 
   * @param price 
   */
  export async function deposit_and_set_price(
    tokenId: string,
	  price: number,
      // account: ConnectedWalletAccount,
    walletConnection: WalletConnection,
    nearConnection: Near,
  ) {
    const priceInNear = utils.format.parseNearAmount(price.toString());
    console.log('priceInNear: ', priceInNear);
	  if(!priceInNear) throw new Error('not price provided');
    
    const args = {};
    const args2 = {
      autotransfer: true,
      token_id: tokenId,
      account_id:MARKETPLACE_HOST_NEAR_ACCOUNT,
      msg: JSON.stringify({
        price: priceInNear.toString(),
        autotransfer: true,
      })
    }
    
    const args_base64 = JsonToUint8Array(args);
    const args2_base64 = JsonToUint8Array(args2);

    const market_cost = 0.02;
    const listCost = calculateListCost(1);
    const deposit = utils.format.parseNearAmount(listCost.toString()) ?? '0';
    const market_deposit = utils.format.parseNearAmount(market_cost.toString()) ?? '0';
    let publicKeys;

    const keys = await walletConnection.account().getAccessKeys();
    if(keys !== undefined) {
      publicKeys = keys.find(key => key.public_key)?.public_key;
      
    } else {
      const ec = new elliptic("secp256k1");
      const keyPair = ec.genKeyPair();
      publicKeys = keyPair.getPublic().encode("hex");
    }
  
    // const publicKey = this.activeNearConnection?.config.keyPair.getPublic().encode("hex");

    const transactions: NearTransaction[] = [
      {
        functionCalls: [
          {
            args: args_base64,
            deposit: toBN(market_deposit),
            gas: MAX_GAS,
            methodName: "deposit_storage"
          }
        ],
        signerId: "",
        receiverId: MARKETPLACE_HOST_NEAR_ACCOUNT,
        publicKey: publicKeys,
        actions: [],
        nonce: toBN(0),
        blockHash: args_base64,
        encode: () => args_base64
      },
      {
        functionCalls: [
          {
            args: args2_base64,
            deposit: toBN(deposit),
            gas: MAX_GAS,
            methodName: "nft_approve"
          }
        ],
        signerId: "",
        receiverId: NANOSTORE_CONTRACT_NAME,
        publicKey: publicKeys,
        actions: [],
        nonce: toBN(0),
        blockHash: args_base64,
        encode: () => args_base64
      }
    ];
    try {
      await executeMultipleTransactions({transactions, walletConnection, nearConnection});
    } catch (error) {
      console.log('error Listing: ', error);
    }
  }

  /**
   * @description Execute multiple transactions
   * ------------------------------------------------------------------------------------
   * @param transactions
   * @param walletConnection
   * @param nearConnection
   * @param options
  */
  export async function executeMultipleTransactions({
    transactions,
    walletConnection,
    nearConnection,
    options,
  }: {
    transactions: NearTransaction[],
    walletConnection: WalletConnection,
    nearConnection: Near,
    options?: OptionalMethodArgs
  }): Promise<void> {

    const nearTransactions = await Promise.all(
      transactions.map(async (tx, i) => {
        return await generateTransaction({
          receiverId: tx.receiverId,
          actions: tx.functionCalls.map((fc) => {
            return functionCall(fc.methodName, fc.args, fc.gas, fc.deposit)
          }),
          nonceOffset: i + 1,
          nearConnection,
          walletConnection,
        })
      })
    )

    walletConnection.requestSignTransactions({
      transactions: nearTransactions,
      callbackUrl: options?.callbackUrl,
      meta: options?.meta,
    })
  }

  /**
   * @description Get local key
   * @param nearConnection 
   * @param account 
   * @returns 
   */
  async function getLocalKey(nearConnection: Near, account: ConnectedWalletAccount) {
    return await nearConnection.connection.signer.getPublicKey(
        account.accountId,
        nearConnection.connection.networkId
      )
  }

  /**
   * @description Generate transaction
   * @param receiverId
   * @param actions
   * @param nonceOffset
   * @param nearConnection
   * @param walletConnection
   */
  export async function generateTransaction({
    receiverId,
    actions,
    nonceOffset,
    nearConnection,
    walletConnection
  }: {
    receiverId: any
    actions: Action[]
    nonceOffset: number,
    nearConnection: Near, 
    walletConnection: WalletConnection
  }) {
    if (!nearConnection || !walletConnection
        ) {
      throw new Error(`No active wallet or NEAR connection.`)
    }

    const account = walletConnection.account()

    const localKey = await getLocalKey(nearConnection, account)
      
    const accessKey = await account.accessKeyForTransaction(receiverId, actions, localKey)

    if (!accessKey) {
      throw new Error(
        `Cannot find matching key for transaction sent to ${receiverId}`
      )
    }

    const block = await nearConnection?.connection.provider.block({
      finality: 'final',
    })

    if (!block) {
      throw new Error(`Cannot find block for transaction sent to ${receiverId}`)
    }

    const blockHash = base_decode(block?.header?.hash)

    const publicKey = PublicKey.from(accessKey.public_key)
    const nonce = accessKey.access_key.nonce + nonceOffset

    return createTransaction(
        account.accountId,
        publicKey,
        receiverId,
        nonce,
        actions,
        blockHash
    )
  }