
/* import { API } from './api';
import { request, gql } from 'graphql-request'
 */
import {
  Wallet as MintbaseWallet,
  Chain,
  Network,
} from 'mintbase';

import {
  keyStores,
  connect,
  Contract,
  ConnectedWalletAccount
} from 'near-api-js';

import {
  NearWalletDetails,
  NetworkConfig,
  OptionalMethodArgs,
} from './types'

import {
  FACTORY_CONTRACT_NAME,
  STORE_CONTRACT_VIEW_METHODS,
  STORE_CONTRACT_CALL_METHODS,
  TESTNET_CONFIG,
  MAX_GAS,
  ONE_YOCTO,
  TWENTY_FOUR,
  MARKET_CONTRACT_VIEW_METHODS,
  MARKET_CONTRACT_CALL_METHODS,
  MAINNET_CONFIG
} from './constants';
import { MintbaseGraphql } from './mintbase-graphql';
import { BehaviorSubject, filter, firstValueFrom, shareReplay, timer } from 'rxjs';
import { MintbaseThing } from '@explorins/types';
import { WalletConfig } from 'mintbase/lib/types';
import { CannotConnectError } from './error/cannotConectError';
import { CannotDisconnectError } from './error/cannotDisconnectError';
import { CannotTransferTokenError } from './error/cannotTransferTokenError';

/** 
 * Object that contains the methods and variables necessary to interact with the near mintbase wallet 
 */
export class NearWallet {
  /** Internal subject that stores login state */
  private _isLogged$ = new BehaviorSubject(false);

  /** Network configuration */
  private networkConfig: NetworkConfig;

  /** External public observable to login state */
  public isLogged$ = this._isLogged$.asObservable().pipe(shareReplay());

  public mintbaseGraphql: MintbaseGraphql | undefined;

  /** Name that give us access to contract */
  public contractName: string | undefined;

  /** Account key for connected user (you) */
  public account: ConnectedWalletAccount | undefined;

  /** mintbaseWallet is the object that contains all mintbase methods and parameters */
  private mintbaseWallet: MintbaseWallet;

  /** Configuration object to login in mintbase */
  private mintbaseWalletConfig: WalletConfig;

  /** Show development helper logs */
  private logs: boolean = true;

  /**
   * @param {string} apiKey 
   * @param {Network} networkName - default value is 'testnet'
   * @param {Chain} chain - default value is 'near'
   */
  public constructor(
    private apiKey: string,
    public networkName: string,
    public chain = Chain.near
  ) {
    switch (networkName) {
      case Network.mainnet:
        this.networkConfig = MAINNET_CONFIG;
        break;
      case Network.testnet:
        this.networkConfig = TESTNET_CONFIG;
        break;
      default:
        throw new Error('Unsupported network: ' + networkName);
    }

    // Set the mintbase main variables
    this.mintbaseWallet = new MintbaseWallet();

    this.mintbaseWalletConfig = {
      networkName: networkName,
      chain: chain,
      apiKey: this.apiKey,
    };

  }

  /**
   * 
   * @returns {NearWalletDetails} get details stored in mintbase connection object
   */
  public async getDetails(): Promise<NearWalletDetails> {
    const { data: details } = await this.mintbaseWallet.details();
    return details;
  }

  public async connect() {

    if (this.mintbaseWallet.isConnected()) {
      return
    };
    // If the wallet is not connected, we go to the connection page
    await this.mintbaseWallet.connect({ requestSignIn: true });

  }

  /**
   * TODO: Errores mas coherentes
   * @throws {CannotConnectError} 
   */
  private async setInfo() {
    try {
      const { data: details } = await this.mintbaseWallet.details();

      this.contractName = details.contractName;
      this.account = this.mintbaseWallet.activeWallet?.account();
      this.mintbaseGraphql = new MintbaseGraphql(this.mintbaseWallet.api?.apiBaseUrl);
      if (this.account) {
        const contract = new Contract(this.account, details.contractName, {
          viewMethods: STORE_CONTRACT_VIEW_METHODS,
          changeMethods: STORE_CONTRACT_CALL_METHODS,
        });
        // show development helper logs
        if (this.logs) {
          console.log('----------------------------------------------------- NEAR INFO ------------------------ ');
          console.log('Details: ', details);
          console.log('contractName: ', details.contractName);
          console.log('Account: ', this.account);
          console.log('El contract: ', contract);
          console.log('El wallet: ', this.mintbaseWallet);
        }
      } else {
        throw new Error('no account');
      }
    } catch (error) {
      throw CannotConnectError.becauseUserNotFound();
    }
  }

  /**
   * We use the mintbase object to make the connection so we can use its methods and properties
   * @throws {CannotConnectError} WITH CODE: 0102, if user not connect to near wallet
   */
  public async mintbaseLogin(): Promise<void> {
    const { data: walletData, error } = await this.mintbaseWallet.init(this.mintbaseWalletConfig);
    const { wallet, isConnected } = walletData;

    if (!isConnected) {
      this._isLogged$.next(false);
      throw CannotConnectError.becauseMintbaseLoginFail();
    }
    this._isLogged$.next(true);
    await this.setInfo();
  }

  // TODO check retry logic
  // Devuelve las things que pertenecen al usuario conectado
  public async getTokenFromCurrentWallet(intent = 0): Promise<MintbaseThing[] | undefined> {
    intent++

    await firstValueFrom(this._isLogged$.pipe(
      filter(ev => ev === true))
    )
    const { data: details } = await this.mintbaseWallet.details();
    try {
      const response = await this.mintbaseGraphql?.getWalletThings(details.accountId);
      console.log('response', response,)
      if (response === undefined && intent < 20) {
        await firstValueFrom(timer(intent * 5000))
        console.log('retry get token from wallet intent ' + intent)
        return this.getTokenFromCurrentWallet(intent)
      }
      return response;
    } catch (error) {
      return [];
    }
  }

  /**
   * Do mintbase signOut, clean local variables and update logged observable
   * @throws {CannotDisconnectError} if mintbase signout method fails
   */
  public disconnect(): void {
    try {
      this.mintbaseWallet.activeWallet?.signOut()
    } catch (error) {
      throw CannotDisconnectError.becauseMintbaseError();
    }

    this.mintbaseWallet.activeNearConnection = undefined
    this.mintbaseWallet.activeAccount = undefined;
    this._isLogged$.next(false);
  }

  /* public isLoggedIn(): Observable<boolean> {
    return of(this.mintbaseWallet.isConnected());
  } */

  /**
   * Transfer one token.
   * @param {string} tokenId The token id to transfer.
   * @param {string} receiverId The account id to transfer to.
   * @param {string} contractName The contract name to transfer tokens from.
   * @throws {CannotTransferTokenError}
   */
  public async transferToken(
    tokenId: string,
    gas = MAX_GAS
  ): Promise<void> {

    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId;
    const contractName = this.mintbaseWallet.activeNearConnection?.config.contractName;

    if (!account || !accountId) {
      throw CannotTransferTokenError.becauseAccountNotFound();
    }

    if (!contractName) {
      throw CannotTransferTokenError.becauseContractNotFound();
    }

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
      await contract.nft_transfer({
        args: { receiver_id: accountId, token_id: tokenId },
        gas: gas,
        amount: ONE_YOCTO,
      });
    } catch (error) {
      throw CannotTransferTokenError.becauseTransactionFails();
    }
    
  }

  public async getMyThings(myStoreId: string) {
    return await this.mintbaseGraphql?.getStoreThings(myStoreId)
  }

  public async makeOffer(
    tokenId: string,
    price: string,
    storeId?: string,
    options?: OptionalMethodArgs & {
      marketAddress?: string
      timeout?: number
    }
  ): Promise<any> {
    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId
    const gas = MAX_GAS;
    const timeout = options?.timeout || TWENTY_FOUR

    if (!account || !accountId) return 'Account is undefined.'
    if (!tokenId) return 'Please provide a tokenId';
    if (!storeId) return 'Must provide a storeId';

    const contract = new Contract(
      account,
      options?.marketAddress ||
      this.mintbaseWallet.constants.MARKET_ADDRESS ||
      `0.${this.mintbaseWallet.constants.FACTORY_CONTRACT_NAME || FACTORY_CONTRACT_NAME}`,
      {
        viewMethods:
          this.mintbaseWallet.constants.MARKET_CONTRACT_VIEW_METHODS ||
          MARKET_CONTRACT_VIEW_METHODS,
        changeMethods:
          this.mintbaseWallet.constants.MARKET_CONTRACT_CALL_METHODS ||
          MARKET_CONTRACT_CALL_METHODS,
      }
    )

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

    return true;
  }

  /**
   * Este método "list_minters" está en la documentación de mintbase, pero no existe ??
   */
  public async getMinters() {

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
   * Only experimental login directly to near network
   */
  public async nearLogin() {

    const connectionObject = {
      deps: {
        keyStore: new keyStores.BrowserLocalStorageKeyStore()
      },
      ...this.networkConfig
    }

    const nearConnection = await connect(
      connectionObject
    )
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
    const response = await this.mintbaseWallet.api?.fetchStores(offset, limit);
    if (response) return response.data.store;
    else throw new Error('Marketplace cannot be accessed.')
  }

  /** Search and retrieve your near store in mintbase platform */
  public async getMyStores() {
    const myStores = await this.mintbaseGraphql?.getStoreByOwner(this.account?.accountId);
    return myStores;
  }

  /**
   * 
   * @param storeId 
   * @returns 
   */
  public async getTokensOfStoreId(storeId: string) {
    return await this.mintbaseGraphql?.getTokensOfStoreId(storeId)
  }


  public async fetchStoreById(
    storeId: string
  ) {
    const response = await this.mintbaseWallet.api?.fetchStoreById(storeId);
    if (response) return response.data;
    else throw new Error('Store cannot be accessed.')
  }
}
