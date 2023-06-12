import { connect as nearConnect, ConnectedWalletAccount, keyStores, Near, utils, WalletConnection } from "near-api-js";
import { Observable, filter, firstValueFrom, interval, map, shareReplay, tap } from "rxjs";
import { CannotConnectError, CannotDisconnectError } from "../error";
import { AccountState, NearNetwork } from "../types";
import { APP_KEY_PREFIX, 
  ConfigData, 
  NANOSTORE_MAINNET_CONFIG, 
  NANOSTORE_TESTNET_CONFIG } from "./constants";
import { initializeExternalConstants } from "../utils/external-constants";
import { KeyStore } from "near-api-js/lib/key_stores";
import { deposit_and_set_price, purchaseToken } from "./functions/transactions.functions";
import { deployStore } from "./functions/store-creation.functions";
import { callToPrint, confirmPrintToken, initPrintToken } from "./functions/printing.funtions";
import { ReferenceObject } from "./interfaces";
import { mintToken } from "./functions/minting.functions";
import { WalletConnector } from "./../wallet-connector";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class NanostoreWallet {
    /** Internal subject that stores login state */
  private walletConnector = new WalletConnector(this.networkName, this.contractId, this.walletConnectProjectId);
  
  get ConnectedWalletAccount(): ConnectedWalletAccount | undefined{
    return this.activeWalletConnection?.account()
  }

  public currentAccount$: Observable<AccountState | null> = this.walletConnector.walletSelectorState$.pipe(
    map((state) => {
      if(!state) return null;
      return state.accounts.find((account) => account.active) || null
    }),
    tap((account) => console.log('account: ', account)),
    /* tap((account) => {
      interval(5000).pipe(
        tap(() => console.log('wallet connect account:  ', this.ConnectedWalletAccount))
      ).subscribe()
    }), */
    shareReplay(1)
  )
  /** External public observable to login state */
  public isLogged$ = this.currentAccount$
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
  private configData?: ConfigData

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
    public networkName: NearNetwork,
    private contractId: string,
    private backendUrl: string,
    private walletConnectProjectId?: string
  ) {
    // MintbaseWallet is required for use this library
    // First of all we set mintbaseWalletConfig

    switch (networkName) {
      case NearNetwork.mainnet:
        this.configData = NANOSTORE_MAINNET_CONFIG
        break;
      case NearNetwork.testnet:
        
        this.configData = NANOSTORE_TESTNET_CONFIG
        break;
      default:
        throw CannotConnectError.becauseUnsupportedNetwork();
    }
    /* this.walletConnector.walletSelectorSetup(
      networkName,
      contractId 
    ); */
    this.walletConnector.walletSelectorState$.subscribe((state) => {
      console.log('state', state);
    })

    this.init();
  }

  /**
   * @description check if wallet is connected
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
  public async connect(){
    return await this.walletConnector.showWalletModal()
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

    if(!this.configData) {
      console.log('no config data');
      return;
    }
    // TODO: get env from backend
    const keyStore = new keyStores.BrowserLocalStorageKeyStore();
    this.keyStore = keyStore;
    const _connectionObject = {
      deps: { keyStore },
      ...this.configData!
    }

    // If the wallet is not connected, we go to the connection page
    const near = await nearConnect(_connectionObject);
    this.activeNearConnection = near;
    // Este es el objeto connection
    this.activeWalletConnection = new WalletConnection(near, APP_KEY_PREFIX);

    if(this.activeWalletConnection.isSignedIn()) {
      console.log('Im connected ... ')
        /* const account = this.activeWalletConnection.account();
        this.setCurrentAccount(account);
        const details = await this.getActiveAccountDetails(); */
    
    } else {
      // this.setCurrentAccount(null);
      console.log('Im not connected ... ')
      const isAsyncSignedIn = await this.activeWalletConnection?.isSignedInAsync()
    }
  }

  // TODO: only for admin
  public async deployStore(symbol: string) {
    const account = this.ConnectedWalletAccount
    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()
    await deployStore(symbol, account)
  }

  /**
   * @description mint a token
   * @param numToMint 
   * @param referenceObject 
   * @returns 
   */
  public async mintToken(
    numToMint: number,
    referenceObject: ReferenceObject
    ) {
    const account = this.ConnectedWalletAccount
    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()
    if(!this.backendUrl) throw CannotConnectError.becauseNoBackendUrl()
    return await mintToken(referenceObject, numToMint, this.backendUrl, account)
  }

  public async listTokenForSale(token_id: string, price: number) {
    const walletConnection = this.activeWalletConnection
    const nearConnection = this.activeNearConnection
    
    if(!walletConnection || !nearConnection) throw CannotConnectError.becauseMintbaseLoginFail()
    return await deposit_and_set_price(token_id, price, walletConnection, nearConnection, this.contractId)
  }  

  // TODO: open for token on other contract??
  public purchaseToken(token_id: string, price: string) {
    purchaseToken(token_id, price, this.contractId, this.ConnectedWalletAccount)
  }

  /**
   * @description initialize print of owned token
   * @param tokenId 
   * @param nearReference 
   * @param productId 
   * @param printerId 
   * @param printingFee 
   * @returns 
   */
  public async initPrintOwnedToken(
    tokenId: string,
    nearReference: string,
    productId: string,
    printerId: string,
    printingFee: number,
    // contractId: string
  ) {
    const account = this.ConnectedWalletAccount
    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()
    if(!this.backendUrl) throw CannotConnectError.becauseNoBackendUrl()
    return await initPrintToken(tokenId, nearReference, productId, printingFee, printerId, this.contractId, this.backendUrl, account)
  }

  /**
   * @description confirm print of owned token
   * @param tokenId
   * @param transactionHashes
   * @param nearReference
   * @param productId
   * @returns
   * @throws {CannotConnectError} if mintbase signout method fails
   */
  public async confirmPrintOwnedToken(tokenId: string, transactionHashes: string, nearReference: string, productId: string){
    
    const account = await firstValueFrom(this.currentAccount$.pipe(filter(account => account !== null)))// .value || undefined
    if(!this.backendUrl) throw CannotConnectError.becauseNoBackendUrl()
    
    await confirmPrintToken(tokenId, nearReference, productId, transactionHashes, this.backendUrl, account!.accountId)
    return await callToPrint(tokenId, nearReference, productId, this.backendUrl);
  }


  /**
   * @description Get active account details
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} if mintbase signout method fails
   * @returns 
   */
  public async getActiveAccountDetails(): Promise<any> {
    const account = this.ConnectedWalletAccount
    const accountId = this.ConnectedWalletAccount?.accountId
    // @TODO throw error
    if (!accountId || !account) return

    const keyPair = await this.keyStore?.getKey(this.networkName, accountId)
    // @TODO throw error
    if (!keyPair) return;

    const publicKey = keyPair.getPublicKey().toString()
    const balance = await account.getAccountBalance()

    if (!balance) return 
    const contractName = this.activeNearConnection?.config.contractName

    const data = {
      accountId: accountId,
      balance: utils.format.formatNearAmount(balance?.total, 2),
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
    // TODO : check if already disconnected
    if(!this.activeWalletConnection?.account()) throw CannotDisconnectError.becauseAlreadyDisconnected();
    
    this.activeWalletConnection?.signOut()
    this.activeNearConnection = undefined
    // this.activeWalletConnection.

    // this.setCurrentAccount(null); 

    this.walletConnector.signOut()
  }
}