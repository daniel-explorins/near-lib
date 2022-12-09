import { Wallet } from "mintbase";
import { Chain, Network, OptionalMethodArgs, WalletConfig } from "mintbase/lib/types";
import { Contract } from "near-api-js";
import { 
  FACTORY_CONTRACT_NAME,
  MARKET_CONTRACT_CALL_METHODS,
  MARKET_CONTRACT_VIEW_METHODS,
  MAX_GAS,
  ONE_YOCTO,
  STORE_CONTRACT_CALL_METHODS,

  STORE_CONTRACT_VIEW_METHODS,
  TWENTY_FOUR } from "./../constants";
import { CannotConnectError } from "./../error/cannotConectError";
import { CannotDisconnectError } from "./../error/cannotDisconnectError";
import { cannotFetchMarketPlaceError } from "./../error/cannotFetchMarketPlaceError";
import { cannotFetchStoreError } from "./../error/cannotFetchStoreError";
import { cannotMakeOfferError } from "./../error/cannotMakeOfferError";
import { CannotTransferTokenError } from "./../error/cannotTransferTokenError";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class MintbaseWallet extends Wallet {

    /** Configuration object to login in mintbase */
    private mintbaseWalletConfig: WalletConfig;

    public constructor(
        private apiKey: string,
        public networkName: Network
    ) {
        super();

        let network;

        switch (networkName) {
            case Network.mainnet:
              network = Network.mainnet;
              break;
            case Network.testnet:
              network = Network.testnet;
              break;
            default:
              throw CannotConnectError.becauseUnsupportedNetwork();
          }

        this.mintbaseWalletConfig = {
            networkName: network,
            chain: Chain.near,
            apiKey: this.apiKey,
          };
    }

  /**
   * @param limit number of results
   * @param offset number of records to skip
   * @throws {cannotFetchMarketPlaceError}
   */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async fetchMarketplace(
      offset?: number,
      limit?: number
    ) {
      const response = await this.api?.fetchMarketplace(offset, limit);
      if (response) return response.data;
      else throw cannotFetchMarketPlaceError.becauseMintbaseError();
    }


    /**
     * @description Initialize the mintbase wallet, this method must be called on app initialization
     * @throws {CannotConnectError} If user is not currently logged in mintbase wallet
     */
    public async mintbaseLogin(): Promise<void>
    {
        let isConnected;

        try {
        
            const { data: walletData } = await this.init(
                this.mintbaseWalletConfig
            );
            isConnected  = walletData.isConnected;

        } catch (error) {
            throw CannotConnectError.becauseMintbaseLoginFail();
        }

        if (!isConnected) {
            throw CannotConnectError.becauseMintbaseLoginFail();
        }
    }

    /**
   * @description
   * @param tokenId 
   * @param price 
   * @param storeId 
   * @param options 
   * @throws {cannotMakeOfferError} 
   */
  public async launchOffer(
    tokenId: string,
    price: string,
    storeId?: string,
    options?: OptionalMethodArgs & {
      marketAddress?: string
      timeout?: number
    }
  ): Promise<void> {

    const account = this.activeWallet?.account()
    const accountId = this.activeWallet?.account().accountId
    const gas = MAX_GAS;
    const timeout = options?.timeout || TWENTY_FOUR

    if (!account || !accountId) throw cannotMakeOfferError.becauseUserNotFound();
    if (!tokenId) throw cannotMakeOfferError.becauseTokenNotFound();
    if (!storeId) throw cannotMakeOfferError.becauseStoreNotFound();

    const contract = new Contract(
      account,
      options?.marketAddress ||
      this.constants.MARKET_ADDRESS ||
      `0.${this.constants.FACTORY_CONTRACT_NAME || FACTORY_CONTRACT_NAME}`,
      {
        viewMethods:
          this.constants.MARKET_CONTRACT_VIEW_METHODS ||
          MARKET_CONTRACT_VIEW_METHODS,
        changeMethods:
          this.constants.MARKET_CONTRACT_CALL_METHODS ||
          MARKET_CONTRACT_CALL_METHODS,
      }
    )
    try {
        // @ts-ignore: method does not exist on Contract type
        await contract.make_offer({
            meta: options?.meta,
            callbackUrl: options?.callbackUrl,
            args: {
            token_key: [tokenId + ":" + storeId], //  ["0:amber_v2.tenk.testnet"],
            price: [price], // 1000000000000000000000000
            timeout: [{ Hours: timeout }],
            },
            gas,
            amount: price,
        })
    } catch (error) {
        throw cannotMakeOfferError.becauseMintbaseError();
    }
  }


    /**
     * @description
     * @throws {CannotConnectError}
     */
    public async getAccountId(): Promise<string>
    {
        try {
            const { data: details } = await this.details();
            return details.accountId;
        } catch (error) {
            throw CannotConnectError.becauseMintbaseError();
        }
    }

    /**
     * @description
     * @throws {CannotDisconnectError}
     */
    public logout(): void
    {
        try {
            this.activeWallet?.signOut()
          } catch (error) {
            throw CannotDisconnectError.becauseMintbaseError();
          }
      
          this.activeNearConnection = undefined
          this.activeAccount = undefined;
    }

    /**
     * @throws {CannotTransferTokenError}
     */
    public async transferToken(
      tokenId: string
    ): Promise<any>
    {
        const account = this.activeWallet?.account()
        const accountId = this.activeWallet?.account().accountId;
        const contractName = this.activeNearConnection?.config.contractName;

        if (!account || !accountId) {
        throw CannotTransferTokenError.becauseAccountNotFound();
        }

        if (!contractName) {
        throw CannotTransferTokenError.becauseContractNotFound();
        }

        const contract = new Contract(account, contractName, {
            viewMethods:
              this.constants.STORE_CONTRACT_VIEW_METHODS ||
              STORE_CONTRACT_VIEW_METHODS,
            changeMethods:
              this.constants.STORE_CONTRACT_CALL_METHODS ||
              STORE_CONTRACT_CALL_METHODS,
            })
        try {
            // @ts-ignore: method does not exist on Contract type
            await contract.nft_transfer({
                args: { 
                    receiver_id: accountId, 
                    token_id: tokenId 
                },
                gas: MAX_GAS,
                amount: ONE_YOCTO,
            });
        } catch (error) {
            throw CannotTransferTokenError.becauseTransactionFails();
        }
    }

    /**
     * @description Returns all the stores that are listed in mintbase
     * @param offset 
     * @param limit 
     * @throws {cannotFetchStoreError} 
     */
    public async fetchStores(
      offset?: number,
      limit?: number
    ): Promise<any>
    {
      try {
        const response = await this.api?.fetchStores(offset, limit);
        if (response) return response.data.store;
      } catch (error) {
        cannotFetchStoreError.becauseMintbaseError();
      }
      throw cannotFetchStoreError.becauseMintbaseError();
    }

    /**
   * @description
   * @param storeId 
   * @throws {cannotFetchStoreError}
   */
    public async fetchStoreById(
        storeId: string
    ): Promise<any>
    {
      try {
        const response = await this.api?.fetchStoreById(storeId);
        if (response && response.data) return response.data;
      } catch (error) {
        throw cannotFetchStoreError.becauseMintbaseError();
      }
      throw cannotFetchStoreError.becauseMintbaseError();
    }
}