import { isBrowser } from "browser-or-node";
import { API, Wallet } from "mintbase";
import { Chain, Network, OptionalMethodArgs, WalletConfig } from "mintbase/lib/types";
import { formatResponse, ResponseData } from "mintbase/lib/utils/responseBuilder";
import { connect, Contract, keyStores, WalletAccount } from "near-api-js";
import { BehaviorSubject } from "rxjs";
import { MintbaseWalletConfig } from "./../types";
import { initializeExternalConstants } from "./../utils/external-constants";
import { 
  CLOUD_URI,
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
import * as utils from './../utils/near';
import { Minter } from "mintbase/lib/minter";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class MintbaseWallet extends Wallet {
  
    public constructor(
        public walletConfig: MintbaseWalletConfig & {contractName: string}
    ) {
        super();
        if(!isBrowser) throw new Error('Only supports browser');
        if(walletConfig.networkName != Network.mainnet && walletConfig.networkName != Network.testnet) throw new Error('unsupported network');
      }

    /**
     * @description This method initializes mintbase factory contract wallet object in a custom way
     * @set 
     * api: @Api de Mintbase, ver si realmente se usa
     * constants
     * networkname: mainnet o testnet
     * chain: Solo usamos near
     * nearConfig: Se usa para conectar con near::connect()
     * activeNearConnection: Object devuelto por near::connect()
     * keyStore: Usamos browser local storage
     * activeWallet: Es el objeto WalletAccount
     * ----------------------------------------------------------
     * @param walletConfig 
     * @returns 
     */
    public async init(
      walletConfig: MintbaseWalletConfig & {contractName: string}
    ): Promise<ResponseData<{ wallet: Wallet; isConnected: boolean }>> {
      
      try {
        // @TODO: do this with nanostore constants ?
        this.constants = await initializeExternalConstants({
          apiKey: walletConfig.apiKey,
          networkName: walletConfig.networkName,
        })
  
        this.api = new API({
          networkName: walletConfig.networkName,
          chain: Chain.near,
          constants: this.constants,
        })
  
        this.networkName = walletConfig.networkName;
        // this lib only supports near
        this.chain = Chain.near;
        this.nearConfig = utils.getNearConfig(
          walletConfig.networkName, 
          walletConfig.contractName
        );
        this.keyStore = new keyStores.BrowserLocalStorageKeyStore();

        
          const connectConfig = {
          deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() },
          headers: {
              'Content-Type': 'application/json',
          },
          ...this.nearConfig
          }
        
        const near = await connect(connectConfig);
        this.activeNearConnection = near;
        this.activeWallet = new WalletAccount(near, 'nanostore');
        

        this.minter = new Minter({
          apiKey: walletConfig.apiKey,
          constants: this.constants,
        });

        
        
        // We only want to init, not connect yet
        // await this.connect()

        // We must return this format because we extend mintbase method
        const data = { wallet: this, isConnected: false };
        return formatResponse({
          data,
        })

      } catch (error: any) {
        // @TODO throw custom error
        throw error;
      }
    }

  /**
   * @description 
   * ---------------------------------------------------
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
   */
  public getConnectionInfo() {
    return this.activeNearConnection ;
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