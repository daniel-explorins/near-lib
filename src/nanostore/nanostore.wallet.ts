import { connect as nearConnect, ConnectedWalletAccount, Contract, keyStores, Near, utils, WalletConnection } from "near-api-js";
import { BehaviorSubject, map, shareReplay } from "rxjs";
import { CannotConnectError, CannotDisconnectError } from "../error";
import { NearNetwork } from "../types";
import { NANOSTORE_CONTRACT_NAME, NANOSTORE_TESTNET_CONFIG } from "./constants";
import { initializeExternalConstants } from "../utils/external-constants";
import { KeyStore } from "near-api-js/lib/key_stores";
import { purchaseToken } from "./functions/transactions.functions";
import { deployStore } from "./functions/store-creation.functions";
import { callToPrint } from "./functions/printing.funtions";
import { ReferenceObject } from "./interfaces";
import { mintToken } from "./functions/minting.functions";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class NanostoreWallet {
    /** Internal subject that stores login state */
  // private _isLogged$ = new BehaviorSubject(false);

  private _currentAccount$ = new BehaviorSubject<ConnectedWalletAccount | null>(null);
  public currentAccount$ = this._currentAccount$.asObservable();
  /** External public observable to login state */
  public isLogged$ = this._currentAccount$.asObservable()
  .pipe(
    map((account) => {
      if(!account) return false;
      return true
    }),
    shareReplay(1)
    );

  // Internal used variables
  private activeWalletConnection?: WalletConnection;
  private activeNearConnection?: Near;
  private constants?: any;
  private keyStore?: KeyStore;

  
  /**
   * @MF TODO: Move initialization from constructor to static public method ?
   * @description The constructor only sets three variables: apiKey, networkName and mintbaseWallet
   * ------------------------------------------------------------------------------------
   * @param {string} apiKey - mintbase apikey 
   * @param {Network} networkName - default value is 'testnet'
   * @throws {CannotConnectError} if network is unrecognized
   */
  public constructor(
    private apiKey: string,
    public networkName: NearNetwork
  ) {
    // MintbaseWallet is required for use this library
    // First of all we set mintbaseWalletConfig
    switch (networkName) {
      case NearNetwork.mainnet:
          
        break;
      case NearNetwork.testnet:
          
        break;
      default:
        throw CannotConnectError.becauseUnsupportedNetwork();
    }
    this.init()


  }

  /**
   * @description
   * @returns 
   */
  public isConnected(): boolean {

    if(!this.activeWalletConnection) return false;
    return this.activeWalletConnection.isSignedIn() ?? false

  }

  /**
   * @description Usually this method must be called on login button action
   * @description Currently making a connection to the mintbase wallet
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} if connection to mintbase could not be made
   */
  public async connect()// : Promise<void>
    
  {   
    if (this.isConnected()) {
      console.warn('near-lib connect(): connecting an already connected wallet.')
      return;
    }

    if(!this.activeWalletConnection) {
      console.log('no active wallet connection');
      return;
    }
    
    try {
      console.log('loggin !! .......');
      // https://docs.near.org/tools/near-api-js/wallet
      const signIn = await this.activeWalletConnection?.requestSignIn({
        contractId: NANOSTORE_CONTRACT_NAME,
        successUrl: '',
        failureUrl: '',
      });
      console.log('signIn : ', signIn);
      const account = this.activeWalletConnection.account();
      this._currentAccount$.next(account);
    } catch (error) {
      this._currentAccount$.next(null);
      throw CannotConnectError.becauseMintbaseLoginFail();
    }
  }

  /**
   * @description initializes mintbase wallet custom object and sets graphql object
   * @description sets logged observable state
   * ------------------------------------------------------------------------------------
   */
  public async init(): Promise<void> {
    this.constants = await initializeExternalConstants({
      apiKey: this.apiKey,
      networkName: this.networkName,
    })

    if(this.activeNearConnection || this.activeWalletConnection) {
      console.log('already initialized');
      return;
    }
    // TODO: get env from backend
    const keyStore = new keyStores.BrowserLocalStorageKeyStore();
    this.keyStore = keyStore;
    const _connectionObject = {
      deps: { keyStore },
      ...NANOSTORE_TESTNET_CONFIG
    }

    // If the wallet is not connected, we go to the connection page
    
    const near = await nearConnect(_connectionObject);

    this.activeNearConnection = near;
    this.activeWalletConnection = new WalletConnection(near, 'Nanostore');
    let initResponse;
    try {
      console.log('Init response --------------------------- : ', initResponse);
    } catch (error) {
        console.log('Init error: ', error);
    }
   
    if(this.activeWalletConnection.isSignedIn()) {
        const account = this.activeWalletConnection.account();
        this._currentAccount$.next(account);
        
        const walletDetails = await this.getActiveAccountDetails();
        console.log('Connection Details ... ', walletDetails)
    } else {
        this._currentAccount$.next(null);
    }
  }

  // TODO: open for token on other contract??
  public purchaseToken(token_id: string) {
    const account = this._currentAccount$.value || undefined
    purchaseToken(token_id, account)
  }

  // TODO: only for admin
  public async deployStore(symbol: string) {
    const account = this._currentAccount$.value || undefined
    await deployStore(symbol, account)
  }

  public async callToPrint(
    tokenId: string
  ) {
    await callToPrint(tokenId)
  }

  public async mintToken(
    numToMint: number,
    referenceObject: ReferenceObject
    ) {
    const account = this._currentAccount$.value || undefined

    return await mintToken(referenceObject, numToMint, account)
  }



  public async getActiveAccountDetails(): Promise<any>
  {
    const account = this._currentAccount$.value
    const accountId = account?.accountId
    // @TODO throw error
    if (!accountId) return 
    const keyPair = await this.keyStore?.getKey(this.networkName, accountId)
    // @TODO throw error
    if (!keyPair) return;

    const publicKey = keyPair.getPublicKey().toString()
    const balance = await account.getAccountBalance()

    // @TODO throw error
    if (!balance) return 

    // @TODO ver que es esto
    // const { data: accessKey } = await this.viewAccessKey(accountId, publicKey)

    /*
    const allowance = utils?.format?.formatNearAmount(
      accessKey?.permission?.FunctionCall?.allowance ?? DEFAULT_ALLOWANCE
    )
    */

    const contractName = this.activeNearConnection?.config.contractName

    const data = {
      accountId: accountId,
      balance: utils.format.formatNearAmount(balance?.total, 2),
      // allowance: allowance,
      contractName: contractName,
    }
    return data;
  }


  /**
   * @description Do signOut, clean local variables and update logged observable
   * ------------------------------------------------------------------------------------
   * @throws {CannotDisconnectError} if mintbase signout method fails
   */
  public disconnect(): void 
  {
    if(!this._currentAccount$.value) throw CannotDisconnectError.becauseAlreadyDisconnected();
    
    this.activeWalletConnection?.signOut()
    this.activeNearConnection = undefined
    // this.activeAccount$= undefined
    this._currentAccount$.next(null);
  }
}