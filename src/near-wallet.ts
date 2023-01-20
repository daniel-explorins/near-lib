

import {
  Contract,
  ConnectedWalletAccount
} from 'near-api-js';

import {
  MintbaseThing,
  NearNetwork,
  NearWalletDetails,
  NetworkConfig,
  OptionalMethodArgs,
} from './types'
import {
  STORE_CONTRACT_VIEW_METHODS,
  STORE_CONTRACT_CALL_METHODS,
  TESTNET_CONFIG,
  MAINNET_CONFIG
} from './constants';
import { MintbaseGraphql } from './mintbase/mintbase-graphql';
import { BehaviorSubject, filter, firstValueFrom, shareReplay, timer } from 'rxjs';
import { CannotConnectError } from './error/cannotConectError';
import { CannotDisconnectError } from './error/cannotDisconnectError';
import { CannotTransferTokenError } from './error/cannotTransferTokenError';
import { MintbaseWallet } from './mintbase/mintbase-wallet';
import { Network } from 'mintbase';
import { CannotGetContractError } from './error/CannotGetContractError';
import { CannotGetTokenError } from './error/CannotGetTokenError';
import { cannotMakeOfferError } from './error/cannotMakeOfferError';
import { cannotFetchStoreError } from './error/cannotFetchStoreError';
import { cannotGetThingsError } from './error/cannotGetThingsError';
import { cannotFetchMarketPlaceError } from './error/cannotFetchMarketPlaceError';
import { GetStoreByOwner, GetTokensOfStoreId } from './graphql_types';
import { cannotGetMintersError } from './error/cannotGetMintersError';

/** 
 * Object that contains the methods and variables necessary to interact with the near wallet 
 * At the moment only the connection to the mintbase wallet is supported
 */
export class NearWallet {
  /** Internal subject that stores login state */
  private _isLogged$ = new BehaviorSubject(false);

  /** Network configuration */
  private networkConfig: NetworkConfig|undefined;

  /** External public observable to login state */
  public isLogged$ = this._isLogged$.asObservable().pipe(shareReplay());

  public mintbaseGraphql: MintbaseGraphql | undefined;


  /** Name that give us access to contract */
  public contractName: string | undefined;

  /** Account key for connected user (you) */
  public account: ConnectedWalletAccount | undefined;

  /** mintbaseWallet is the object that contains all mintbase methods and parameters */
  private mintbaseWallet: MintbaseWallet|null = null;

  /** Show development helper logs */
  private logs: boolean = true;

  /**
   * @MF TODO: Move initialization from constructor to static public method
   * ------------------------------------------------------------------------------------
   * @param {string} apiKey - mintbase apikey 
   * @param {Network} networkName - default value is 'testnet', mintbase_testnet
   * @throws {CannotConnectError} if network is unrecognized
   */
  public constructor(
    private apiKey: string,
    public networkName: string = NearNetwork.mintbase_testnet
  ) {
    switch (networkName) {
      case NearNetwork.mainnet:
        this.networkConfig = MAINNET_CONFIG;
        break;
      case NearNetwork.testnet:
        this.networkConfig = TESTNET_CONFIG;
        break;
      case NearNetwork.mintbase_mainnet:
        this.mintbaseWallet = new MintbaseWallet(apiKey, Network.mainnet);
        break;
      case NearNetwork.mintbase_testnet:
        this.mintbaseWallet = new MintbaseWallet(apiKey, Network.testnet);
        break;
      default:
        throw CannotConnectError.becauseUnsupportedNetwork();
    }
  }

  /**
   * @description It is simply a bridge to the details of the wallet
   * ------------------------------------------------------------------------------------
   * @returns {{details: NearWalletDetails}} get details stored in mintbase connection object
   * @throws {CannotConnectError} If dont have mintbase wallet or mintbase lib method throws an exception
   */
  public async getMintbaseAccountData(): Promise<{details: NearWalletDetails}> {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
    try {
      const { data: details } = await this.mintbaseWallet.details();
      console.log('Setting Data !! ')
      const contractName = details.contractName;
      const account = this.mintbaseWallet.activeWallet?.account();
      this.mintbaseGraphql = new MintbaseGraphql(this.mintbaseWallet.api?.apiBaseUrl);
    
      return {details, contractName, account};
    } catch (error) {
      throw CannotConnectError.becauseMintbaseError();
    }
  }

  /**
   * @description Usually this method must be called on login button action
   * @description Currently making a connection to the mintbase wallet
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} if connection to mintbase could not be made
   */
  public async connect(): Promise<void>
  {
    console.log(' ************* this.mintbaseWallet ****************** ', this.mintbaseWallet)
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
    if (this.mintbaseWallet.isConnected()) {
      this._isLogged$.next(true);
      return;
    }
    
    try {
      // If the wallet is not connected, we go to the connection page
      await this.mintbaseWallet.connect({ requestSignIn: true });
      this._isLogged$.next(true);
    } catch (error) {
      throw CannotConnectError.becauseMintbaseLoginFail();
    }
  }

  /**
   * @description return near contract that is being used
   * ------------------------------------------------------------------------------------
   * @throws {CannotGetContractError} if account or contractName not found
   */
  public getContract() {
    if(!this.account) throw CannotGetContractError.becauseUserNotFound();
    if(!this.contractName) throw CannotGetContractError.becauseContractNameNotFound();

    try {
      
      const contract = new Contract(
        this.account, 
        this.contractName,
        {
          viewMethods: STORE_CONTRACT_VIEW_METHODS,
          changeMethods: STORE_CONTRACT_CALL_METHODS
        }
      );

      return contract;
      
    } catch (error) {
      throw CannotGetContractError.becauseNearError();
    }
  }

  /**
   * @description set account info from mintbase connection
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} code: 0102. If user currently not logged to near wallet
   * @throws {CannotConnectError} code: 0105. If cannot retrieve wallet details from mintbase user or uncatched mintabse error.
   */
  public async setMintbaseData(): Promise<void> {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
  }

  // @TODO legacy method, deprecate it
  public async mintbaseLogin(): Promise<void> {
    return this.mintbaseLoggedOrFail();
  }

  /**
   * @description Check if we are already logged on mintbase
   * @description We use the mintbase object to retrieve actual connection so we can use its methods and properties
   * @description Set local variables to work with mintbase connection
   * @description This method must be called on app initialization or refresh
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} code: 0102. If user currently not logged to near wallet
   * @throws {CannotConnectError} code: 0105. If cannot retrieve wallet details from mintbase user or uncatched mintabse error.
   */
  public async mintbaseLoggedOrFail(): Promise<void> {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();

    try {
      await this.mintbaseWallet.loggedOrFail();
      // @MF TODO: quizás moverlo a un setup ?
      this.mintbaseGraphql = new MintbaseGraphql(this.mintbaseWallet.api?.apiBaseUrl);
    } catch (error) {
      this._isLogged$.next(false);
      if(error instanceof CannotConnectError) throw error;
      else throw CannotConnectError.becauseMintbaseError();
    }
    this._isLogged$.next(true);
  }

  /**
   * TODO: check retryFetch logic
   * @description Returns the things that belong to the connected user
   * ------------------------------------------------------------------------------------
   * @param {int} intent we intent to get things max 20 times
   * 
   * @throws {CannotGetTokenError} code: 501. If mintbase not found
   * @throws {CannotGetTokenError} code: 502. If timeout error
   * @throws {CannotGetTokenError} code: 503. If mintbase error 
   * @returns {Promise<MintbaseThing[]>}
   */
  public async getTokenFromCurrentWallet( 
    intent = 0
  ): Promise<MintbaseThing[] | undefined>
  {
    if(!this.mintbaseWallet) throw CannotGetTokenError.becauseMintbaseNotConnected();

    intent++
    const accountId = await this.mintbaseWallet?.getAccountId();

    await firstValueFrom(this._isLogged$.pipe(
      filter(ev => ev === true))
    )
     try {
      const response = await this.mintbaseGraphql?.getWalletThings(accountId);

      if (response === undefined && intent < 20) {
        // Do a timeout await
        await firstValueFrom(timer(intent * 5000))
        return this.getTokenFromCurrentWallet(intent)
      } else if(intent >= 20) {
        throw CannotGetTokenError.becauseTimeoutError();
      } 
      return response;

    } catch (error) {
      throw CannotGetTokenError.becauseMintbaseError();
    }
  }

  /**
   * @description Do mintbase signOut, clean local variables and update logged observable
   * ------------------------------------------------------------------------------------
   * @throws {CannotDisconnectError} if mintbase signout method fails
   */
  public disconnect(): void 
  {
    if(!this.mintbaseWallet) throw CannotDisconnectError.becauseMintbaseNotConnected();
    if(!this._isLogged$.value) throw CannotDisconnectError.becauseAlreadyDisconnected();
    
    this.mintbaseWallet.logout();
    this._isLogged$.next(false);
  }


  /**
   * @description Transfer one token inside mintbase wallet.
   * ------------------------------------------------------------------------------------
   * @description This method depends on STORE_CONTRACT_CALL_METHODS and STORE_CONTRACT_VIEW_METHODS ,  twice mintbase constants
   * @param {string} tokenId The token id to transfer.
   * @throws {CannotTransferTokenError}
   */
  public async transferToken(
    tokenId: string
  ): Promise<void> 
  {
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();
    await this.mintbaseWallet.transferToken(tokenId);
  }

  /**
   * TODO: change the method name to more descriptive: getMyStoreThings
   * @description -
   * ------------------------------------------------------------------------------------
   * @param myStoreId 
   * @throws {cannotGetThingsError}
   */
  public async getMyThings(myStoreId: string) {
    try {
      const things =  await this.mintbaseGraphql?.getStoreThings(myStoreId);
      return things;
    } catch (error) {
      throw cannotGetThingsError.becauseMintbaseError();
    }
  }

  /**
   * @description It is a bridge to use the native function of mintbase
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
    if(!this.mintbaseWallet) throw cannotMakeOfferError.becauseMintbaseNotConnected();

    await this.mintbaseWallet.launchOffer(tokenId, price, storeId, options);

    return true;
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
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();
    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId
    const contractName = this.mintbaseWallet.activeNearConnection?.config.contractName

    if (!account || !accountId || !contractName) throw cannotGetMintersError.becauseMintbaseNotConnected();

    const contract = new Contract(account, contractName, {
      viewMethods:
        this.mintbaseWallet.constants.STORE_CONTRACT_VIEW_METHODS ||
        STORE_CONTRACT_VIEW_METHODS,
      changeMethods:
        this.mintbaseWallet.constants.STORE_CONTRACT_CALL_METHODS ||
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
   * @description It is a bridge to use the native function of mintbase
   * ------------------------------------------------------------------------------------
   * @param limit number of results
   * @param offset number of records to skip
   * @throws {cannotFetchMarketPlaceError}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async fetchMarketplace(
    offset?: number,
    limit?: number
  ) {
    if(!this.mintbaseWallet) throw cannotFetchMarketPlaceError.becauseMintbaseNotConnected();
    return await this.mintbaseWallet.fetchMarketplace(offset, limit);
  }

  /**
   * TODO: improve any return
   * @description It is a bridge to use the native function of mintbase
   * ------------------------------------------------------------------------------------
   * @param limit number of results
   * @param offset number of records to skip
   * @throws {cannotFetchStoreError} code: 0701. If internal mintbaseWallet was not found
   * @throws {cannotFetchStoreError} code: 0702. If internal mintbaseWallet api throws error
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async fetchStores(
    offset?: number,
    limit?: number
  ): Promise<any>
  {
    if(!this.mintbaseWallet) throw cannotFetchStoreError.becauseMintbaseNotConnected();
    return await this.mintbaseWallet.fetchStores(offset, limit);
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
    if(!this.account || !this.mintbaseGraphql) throw cannotFetchStoreError.becauseMintbaseNotConnected();
    try {
      return await this.mintbaseGraphql.getStoreByOwner(this.account?.accountId);
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
   * TODO: improve any return
   * @description It is a bridge to use the native function of mintbase
   * ------------------------------------------------------------------------------------
   * @param storeId 
   * @throws {cannotFetchStoreError} code: 0701. If internal mintbaseWallet object was not found
   * @throws {cannotFetchStoreError} code: 0702. If internal mintbase api throws error
   */
  public async fetchStoreById(
    storeId: string
  ): Promise<any>
  {
    if(!this.mintbaseWallet) throw cannotFetchStoreError.becauseMintbaseNotConnected();

    return await this.mintbaseWallet.fetchStoreById(storeId);
  }
}
