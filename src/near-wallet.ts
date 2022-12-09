

import {
  Contract,
  ConnectedWalletAccount
} from 'near-api-js';

import {
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
import { MintbaseThing } from '@explorins/types';
import { CannotConnectError } from './error/cannotConectError';
import { CannotDisconnectError } from './error/cannotDisconnectError';
import { CannotTransferTokenError } from './error/cannotTransferTokenError';
import { MintbaseWallet } from './mintbase/mintbase-wallet';
import { Network } from 'mintbase';
import { CannotGetContractError } from './error/CannotGetContractError';
import { CannotGetTokenError } from './error/CannotGetTokenError';
import { cannotMakeOfferError } from './error/cannotMakeOfferError';
import { cannotFetchStoreError } from './error/cannotFetchStoreError';

/** 
 * Object that contains the methods and variables necessary to interact with the near mintbase wallet 
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
   * @param {string} apiKey 
   * @param {Network} networkName - default value is 'testnet'
   * @throws {CannotConnectError} if network is unrecognized
   */
  public constructor(
    private apiKey: string,
    public networkName: string
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
   * @returns {NearWalletDetails} get details stored in mintbase connection object
   * @throws {CannotConnectError} If dont have mintbase wallet or mintbase lib method throws an exception
   */
  public async getDetails(): Promise<NearWalletDetails> {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
    try {
      const { data: details } = await this.mintbaseWallet.details();
      return details;
    } catch (error) {
      throw CannotConnectError.becauseMintbaseError();
    }
  }

  /**
   * @description 
   * @returns 
   * @throws {CannotConnectError}
   */
  public async connect() {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
    if (this.mintbaseWallet.isConnected()) return;
    
    try {
      // If the wallet is not connected, we go to the connection page
      await this.mintbaseWallet.connect({ requestSignIn: true });
    } catch (error) {
      throw CannotConnectError.becauseMintbaseLoginFail();
    }
  }

  /**
   * @description
   * @throws {CannotGetContractError}
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
   * @description We use the mintbase object to make the connection so we can use its methods and properties
   * Set local variables to work with mintbase connection
   * @throws {CannotConnectError} if user not connect to near wallet
   */
  public async loginToWallet(): Promise<void> {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();

    try {
      await this.mintbaseWallet.mintbaseLogin();
    } catch (error) {
      this._isLogged$.next(false);
    }
    this._isLogged$.next(true);
    
    try {
      const { data: details } = await this.mintbaseWallet.details();
      this.contractName = details.contractName;
      this.account = this.mintbaseWallet.activeWallet?.account();
      this.mintbaseGraphql = new MintbaseGraphql(this.mintbaseWallet.api?.apiBaseUrl);
    } catch (error) {
      throw CannotConnectError.becauseMintbaseError();
    }
       
    // show development helper logs
    if (this.logs) {
      console.log('----------------------------------------------------- NEAR INFO ------------------------ ');
      console.log('Account: ', this.account);
      console.log('El wallet: ', this.mintbaseWallet);
    }
  }

  /**
   * TODO: check retryFetch logic
   * @description Devuelve las things que pertenecen al usuario conectado
   * @param intent 
   * 
   * @throws {CannotConnectError} if error occurs in mintbase wallet bridge 
   * @throws {CannotGetTokenError} If mintbase not found or timeout error
   */
  public async getTokenFromCurrentWallet(intent = 0): Promise<MintbaseThing[] | undefined> {
    if(!this.mintbaseWallet) throw CannotGetTokenError.becauseMintbaseNotConnected();

    intent++
    const accountId = await this.mintbaseWallet?.getAccountId();

    await firstValueFrom(this._isLogged$.pipe(
      filter(ev => ev === true))
    )
     try {
      const response = await this.mintbaseGraphql?.getWalletThings(accountId);

      if (response === undefined && intent < 20) {
        await firstValueFrom(timer(intent * 5000))
        return this.getTokenFromCurrentWallet(intent)
      }
      return response;
    } catch (error) {
      throw CannotGetTokenError.becauseTimeoutError();
    }
  }

  /**
   * @description Do mintbase signOut, clean local variables and update logged observable
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
   * @description This method depends on STORE_CONTRACT_CALL_METHODS and STORE_CONTRACT_VIEW_METHODS ,  twice mintbase constants
   * @param {string} tokenId The token id to transfer.
   * @throws {CannotTransferTokenError}
   */
  public async transferToken(
    tokenId: string
  ): Promise<void> 
  {
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();
    await this.mintbaseWallet?.transferToken(tokenId);

  }

  public async getMyThings(myStoreId: string) {
    return await this.mintbaseGraphql?.getStoreThings(myStoreId)
  }

  /**
   * @description
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
   * Este método "list_minters" está en la documentación de mintbase, pero no existe ??
   */
  public async getMinters() {
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();
    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId
    const contractName = this.mintbaseWallet.activeNearConnection?.config.contractName

    if (!account || !accountId) {
      throw new Error('Account is undefined.');
    }

    if (!contractName) {
      throw new Error('No contract name was provided.')
    }

    const contract = new Contract(account, contractName, {
      viewMethods:
        this.mintbaseWallet.constants.STORE_CONTRACT_VIEW_METHODS ||
        STORE_CONTRACT_VIEW_METHODS,
      changeMethods:
        this.mintbaseWallet.constants.STORE_CONTRACT_CALL_METHODS ||
        STORE_CONTRACT_CALL_METHODS,
    })

    // @ts-ignore: method does not exist on Contract type
    const minters = await contract.list_minters();
  }


  /**
   * @param limit number of results
   * @param offset number of records to skip
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async fetchMarketplace(
    offset?: number,
    limit?: number
  ) {
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();

    const response = await this.mintbaseWallet.api?.fetchMarketplace(offset, limit);
    if (response) return response.data;
    else throw new Error('Marketplace cannot be accessed.')
  }

  /**
   * Devuelve todas las stores que se encuentran listadas en mintbase
   * @param limit number of results
   * @param offset number of records to skip
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async fetchStores(
    offset?: number,
    limit?: number
  ) {
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();

    const response = await this.mintbaseWallet.api?.fetchStores(offset, limit);
    if (response) return response.data.store;
    else throw new Error('Marketplace cannot be accessed.')
  }

  /**
   * @description Search and retrieve your near store in mintbase platform
   * @returns 
   */
  public async getMyStores() {
    const myStores = await this.mintbaseGraphql?.getStoreByOwner(this.account?.accountId);
    return myStores;
  }

  /**
   * @description
   * @param storeId 
   * @returns 
   */
  public async getTokensOfStoreId(storeId: string) {
    return await this.mintbaseGraphql?.getTokensOfStoreId(storeId)
  }


  /**
   * TODO: fix any type of return
   * @description
   * @param storeId 
   * @throws {cannotFetchStoreError} 
   */
  public async fetchStoreById(
    storeId: string
  ): Promise<any>
  {
    if(!this.mintbaseWallet) throw cannotFetchStoreError.becauseMintbaseNotConnected();

    const response = await this.mintbaseWallet.fetchStoreById(storeId);
    return response;
  }
}
