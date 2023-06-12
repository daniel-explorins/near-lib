import { cannotMakeOfferError } from "./../../error/cannotMakeOfferError";
import { MARKETPLACE_HOST_NEAR_ACCOUNT, MINTBASE_MARKET_CONTRACT_CALL_METHODS, MINTBASE_MARKET_CONTRACT_VIEW_METHODS } from "./../../mintbase/constants";
import { connect as nearConnect, ConnectedWalletAccount, Contract, Near, utils, WalletConnection, Account, transactions } from "near-api-js";
import { MAX_GAS } from "./../../constants";
import { AccountState, NearTransaction, OptionalMethodArgs } from "./../../types";
import { JsonToUint8Array, calculateListCost, toBN } from "./../../utils/helpers";

const elliptic = require("elliptic").ec;

/**
   * @description Purchase a token
   * ------------------------------------------------------------------------------------
   * @param token_id
   * @param price
   * @param contractId
   * @param account
*/
export async function purchaseToken(
  token_id: string, 
  price: string, 
  contractId: string,
  // 
  wallet: any,
  account: Account | AccountState
  ) {
    const gas = MAX_GAS;
    const accountId = account?.accountId
    

    if (!account || !accountId) throw cannotMakeOfferError.becauseUserNotFound();

    // Mitbase market connection
    const contract = new Contract(
      account as Account,
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

        await wallet.signAndSendTransactions({
          transactions: [
            {
              receiverId: contract.contractId, // "storepruebas4.nanostore.testnet", //'polexplorins.testnet'
              actions: [
                {
                  type: "FunctionCall",
                  params: {
                    methodName: "buy",
                    args: {
                      // TODO: open for other token
                      nft_contract_id: contractId, //  'nanostore_store.dev-1675363616907-84002391197707',
                      token_id
                    },
                    gas: gas,
                    deposit: amount,
                  },
                },
              ],
            },
          ],
        });
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
   * @param walletConnection
   * @param nearConnection
   * @param contractId
   */
  export async function deposit_and_set_price(
    tokenId: string,
	  price: number,
    account: any,// ConnectedWalletAccount,
    contractId: string,
    wallet: any
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
        publicKey: account.publicKey.toString(),
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
        receiverId: contractId,
        publicKey: account.publicKey.toString(),
        actions: [],
        nonce: toBN(0),
        blockHash: args_base64,
        encode: () => args_base64
      }
    ];
    try {
      await executeMultipleTransactions({transactions, wallet});
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
    wallet,
    options,
  }: {
    transactions: NearTransaction[],
    wallet: any,
    options?: OptionalMethodArgs
  }): Promise<void> {

    const nearTransactions = // await Promise.all(
      transactions.map((tx, i) => {
        const transaction = {
          receiverId: tx.receiverId,
          actions: tx.functionCalls.map((fc) => {
            const action = {
              type: "FunctionCall",
              params: {
                methodName: fc.methodName,
                args: fc.args,
                gas: fc.gas,
                deposit: fc.deposit
              }
            }
            return action
          })
        }
        return transaction

      })
    await wallet.signAndSendTransactions({
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
  /* async function getLocalKey(nearConnection: Near, account: ConnectedWalletAccount) {
    return await nearConnection.connection.signer.getPublicKey(
        account.accountId,
        nearConnection.connection.networkId
      )
  } */
