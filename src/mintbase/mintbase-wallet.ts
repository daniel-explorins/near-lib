import { isBrowser } from "browser-or-node";
import { API, Wallet } from "mintbase";
import { Chain, Network, OptionalMethodArgs, WalletConfig } from "mintbase/lib/types";
import { formatResponse, ResponseData } from "mintbase/lib/utils/responseBuilder";
import { connect, Contract, keyStores, WalletAccount } from "near-api-js";
import { firstValueFrom, timer } from "rxjs";
import { MintbaseWalletConfig } from "./../types";
import { initializeExternalConstants } from "./../utils/external-constants";
import { 
  DEPLOY_STORE_COST,
  FACTORY_CONTRACT_NAME,
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
import * as nearUtils from './../utils/near';
import { Minter } from "mintbase/lib/minter";
import { MintbaseGraphql } from "./mintbase-graphql";
import { getGraphQlUri } from "../utils/graphQl";
import { CannotGetTokenError } from "../error/CannotGetTokenError";
import { cannotGetMintersError, cannotGetThingsError } from "../error";
import { GetStoreByOwner, GetTokensOfStoreId } from "../graphql_types";
import BN from "bn.js";
import { MINTBASE_MARKET_CONTRACT_CALL_METHODS, MINTBASE_MARKET_CONTRACT_VIEW_METHODS } from "./constants";
/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class MintbaseWallet extends Wallet {

    public mintbaseGraphql: MintbaseGraphql | undefined;
  
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
     * api: @Api de Mintbase, TODO: ver si realmente se usa
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
        });

        this.networkName = walletConfig.networkName;

        this.mintbaseGraphql = new MintbaseGraphql(getGraphQlUri(this.networkName));
        
        // this lib only supports near
        this.chain = Chain.near;
        this.nearConfig = nearUtils.getNearConfig(
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
        const data = { wallet: this, isConnected: this.isConnected() };
        return formatResponse({
          data,
        })

      } catch (error: any) {
        // @TODO throw custom error
        console.log('Candemoooor ', error)
        throw error;
      }
    }

    /**
   * TODO: check retryFetch logic
   * @description Returns the things that belong to the connected user
   * ------------------------------------------------------------------------------------
   * @param {int} intent we intent to get things max 20 times
   * 
   * @throws {CannotGetTokenError} code: 503. If mintbase error 
   * @returns {Promise<MintbaseThing[]>}
   */
  public async getWalletThings( 
    intent = 0
  ): Promise<any>
  {
    intent++;
    const {data: details} = await this.details();
    try {
      return await this.mintbaseGraphql?.getWalletThings(details.accountId);
      // const response = await this.mintbaseGraphql?.getWalletThings(details.accountId);
      // console.log('response getWalletThings: *****************', response, );
      // return response;
    } catch (error) {
      if (intent < 20) {
        // Do a timeout await
        await firstValueFrom(timer(intent * 5000));
        return this.getWalletThings(intent)
      } else if(intent >= 20) {
        throw CannotGetTokenError.becauseMintbaseError();
        
      } 
    }
  }

  public async getTokensFromCurrentContract( 
    intent = 0
  ): Promise<any>
  {
    if(!this.activeWallet || !this.activeWallet.isSignedIn()) {
      console.warn('Trying to get data of no logged account.');
      return [];
    }
    intent++;
    const {data: details} = await this.details();
    try {
      return await this.mintbaseGraphql?.getTokensFromContract(0,10, details.contractName);
    } catch (error) {
      if (intent < 20) {
        await firstValueFrom(timer(intent * 5000));
        return this.getTokensFromCurrentContract(intent)
      } else if(intent >= 20) {
        throw CannotGetTokenError.becauseMintbaseError();
      } 
    }
  }

  /**
   * List an item for sale in the market.
   * @param tokenId The token id.
   * @param storeId The token store id (contract name).
   * @param price The listing price.
   * @param splitOwners List of splits.
   */
  public async list(
    tokenId: string,
    storeId: string,
    price: string,
    options?: OptionalMethodArgs & {
      autotransfer?: boolean
      marketAddress?: string
    }
  ): Promise<ResponseData<boolean>> {
    const account = this.activeWallet?.account()
    const accountId = this.activeWallet?.account().accountId
    const gas = !options?.gas ? MAX_GAS : new BN(options?.gas)

    if (!account || !accountId)
      return formatResponse({ error: 'Account is undefined.' })

    const contract = new Contract(account, storeId, {
      viewMethods:
        this.constants.STORE_CONTRACT_VIEW_METHODS ||
        STORE_CONTRACT_VIEW_METHODS,
      changeMethods:
        this.constants.STORE_CONTRACT_CALL_METHODS ||
        STORE_CONTRACT_CALL_METHODS,
    })

    // cost for one token
    const listCost = nearUtils.calculateListCost(1)

    // @ts-ignore: method does not exist on Contract type
    await contract.nft_approve({
      meta: options?.meta,
      callbackUrl: options?.callbackUrl,
      args: {
        autotransfer: true,
        token_id: tokenId,
        account_id:'market-v2-beta.mintspace2.testnet',
        msg: JSON.stringify({
          price: price,
          autotransfer: true,
        }),
      },
      gas: gas,
      amount: DEPLOY_STORE_COST
    })

    return formatResponse({ data: true })
  }

	/**
	 * @description -
	 * ------------------------------------------------------------------------------------
	 * @param myStoreId 
	 * @throws {cannotGetThingsError}
	 */
	public async getMyThings(myStoreId: string) {
    if(!this.activeWallet || !this.activeWallet.isSignedIn()) {
      console.warn('Trying to get data of no logged account.');
      return [];
    }
    const {data: details} = await this.details();
		try {
		return await this.mintbaseGraphql?.getWalletThings(myStoreId);
		} catch (error) {
		throw cannotGetThingsError.becauseMintbaseError();
		}
	}

	/**
   * @description It is a bridge to use the native function of mintbase
   * -------------------------------------------------------------------
   * @param tokenId 
   * @param price 
   * @param storeId 
   * @param options 
   * @throws {cannotMakeOfferError} 
   */
	public async offer(
		tokenId: string,
		price: string,
		storeId?: string,
		options?: OptionalMethodArgs & {
		  marketAddress?: string
		  timeout?: number
		}
	  ): Promise<boolean> {
		await this.launchOffer(tokenId, price, storeId, options);
		return true;
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
   * -----------------------------------------------------
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
        viewMethods:MINTBASE_MARKET_CONTRACT_VIEW_METHODS,
        changeMethods: MINTBASE_MARKET_CONTRACT_CALL_METHODS,
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
   * ---------------------------------------------
   */
  public getConnectionInfo() {
    return this.activeNearConnection ;
  }

  /**
   * TODO: Este método "list_minters" está en la documentación de mintbase, pero no existe ??
   * TODO: improve any return
   * @description Call the contract method list_minters
   * ------------------------------------------------------------------------------------
   * @throws {cannotGetMintersError} code: 0901. If some of the mandatory params not found
   * @throws {cannotGetMintersError} code: 0903. If contract method fails
   */
  public async getMinters(): Promise<any>
  {
    if(!this.activeWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();
    const account = this.activeWallet?.account()
    const accountId = this.activeWallet?.account().accountId
    const contractName = this.activeNearConnection?.config.contractName;

    if (!account || !accountId || !contractName) throw cannotGetMintersError.becauseMintbaseNotConnected();

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
      const minters = await contract.list_minters();
      return minters;
    } catch (error) {
      throw cannotGetMintersError.becauseContractError();
    }
  }

  /**
   * TODO: improve any return
   * @description Search and retrieve your near store in mintbase platform
   * ------------------------------------------------------------------------------------
   * @throws {cannotFetchStoreError} code: 0701. If some of the mandatory params was not found
   * @throws {cannotFetchStoreError} code: 0703. If graphql error
   */
  public async getMyStores(): Promise<GetStoreByOwner>
  {
    if(!this.activeWallet || !this.mintbaseGraphql) throw cannotFetchStoreError.becauseMintbaseNotConnected();
    try {
		const accountId = this.activeWallet.account().accountId;
      	return await this.mintbaseGraphql.getStoreByOwner(accountId);
    } catch (error) {
      throw cannotFetchStoreError.becauseGraphqlError();
    }
  }

	/**
	 * @description
	 * ------------------------------------------------------------------------------------
	 * @param storeId 
	 * @throws {cannotFetchStoreError} code: 0701. If internal mintbaseGraphql object was not found
	 * @throws {cannotFetchStoreError} code: 0703. If graphql error
	 */
	public async getTokensOfStoreId(
		storeId: string
	): Promise<GetTokensOfStoreId>
	{
		if(!this.mintbaseGraphql) throw cannotFetchStoreError.becauseMintbaseNotConnected();
		try {
		const tokens = await this.mintbaseGraphql.getTokensOfStoreId(storeId)
		return tokens;
		} catch (error) {
		throw cannotFetchStoreError.becauseGraphqlError();
		}
	}


    /**
     * @description
     * ------------------------------------------------
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
     * @description
     * -----------------------------------------------
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
                    receiver_id: 'nanostore.testnet', 
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
     * ------------------------------------------------------------
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
   * --------------------------------------------------------------
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