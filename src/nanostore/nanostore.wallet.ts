import { connect as nearConnect, ConnectedWalletAccount, keyStores, Near, utils, WalletConnection } from "near-api-js";
import { BehaviorSubject, filter, firstValueFrom, map, shareReplay } from "rxjs";
import { CannotConnectError, CannotDisconnectError } from "../error";
import { NearNetwork } from "../types";
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
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupWalletConnect } from "@near-wallet-selector/wallet-connect";
import { setupWalletSelector } from "@near-wallet-selector/core";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class NanostoreWallet {
    /** Internal subject that stores login state */
  // private _isLogged$ = new BehaviorSubject(false);

  private walletModal: any = null;
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
    private contractId: string
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
    this.walletSelectorSetup();
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

  public async walletSelectorSetup() {

    const _selector = await setupWalletSelector({
      network: "testnet",
      debug: true,
      modules: [
        setupMyNearWallet(),
        setupLedger(),
        setupNearWallet(),
        setupWalletConnect({
          projectId: "c4f79cc...",
          metadata: {
            name: "NEAR Wallet Selector",
            description: "Example dApp used by NEAR Wallet Selector",
            url: "https://github.com/near/wallet-selector",
            icons: ["https://avatars.githubusercontent.com/u/37784886"],
          },
        })
      ],
    });

    this.walletModal = setupModal(_selector, {
      contractId: this.contractId,
    });

    // const state = _selector.store.getState();
    // Cuando no estamos logeados esto peta
    try {
      // wallet es el que contiene los métodos sigin y signout
      const wallet = await _selector.wallet();
      const accounts = await wallet.getAccounts();
    } catch(err) {

    }

  }

  /**
   * @description Usually this method must be called on login button action
   * @description Currently making a connection to the mintbase wallet
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} if connection to mintbase could not be made
   */
  public async connect(){   
    this.walletModal.show();
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
        const account = this.activeWalletConnection.account();
        this._currentAccount$.next(account);
        const details = await this.getActiveAccountDetails();
    
    } else {
      this._currentAccount$.next(null);
      console.log('Im not connected ... ')
      const isAsyncSignedIn = await this.activeWalletConnection?.isSignedInAsync()
      if(isAsyncSignedIn) {
        const account = this.activeWalletConnection.account();
        this._currentAccount$.next(account);
      }
    }
  }

  // TODO: only for admin
  public async deployStore(symbol: string) {
    const account = this._currentAccount$.value || undefined
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
    const account = this._currentAccount$.value || undefined

    return await mintToken(referenceObject, numToMint, account)
  }

  public async listTokenForSale(token_id: string, price: number) {
    const walletConnection = this.activeWalletConnection
    const nearConnection = this.activeNearConnection
    
    if(!walletConnection || !nearConnection) throw CannotConnectError.becauseMintbaseLoginFail()
    return await deposit_and_set_price(token_id, price, walletConnection, nearConnection, this.contractId)
  }  

  // TODO: open for token on other contract??
  public purchaseToken(token_id: string, price: string) {
    const account = this._currentAccount$.value || undefined
    purchaseToken(token_id, price, this.contractId, account)
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
    const account = this._currentAccount$.value || undefined
    return await initPrintToken(tokenId, nearReference, productId, printingFee, printerId, this.contractId, account)
  }

  public async confirmPrintOwnedToken(tokenId: string, transactionHashes: string, nearReference: string, productId: string){
    
    const account = await firstValueFrom(this._currentAccount$.pipe(filter(account => account !== null)))// .value || undefined
    await confirmPrintToken(tokenId, nearReference, productId, transactionHashes, account!)
    return await callToPrint(tokenId, nearReference, productId);
  }


  /**
   * @description Get active account details
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} if mintbase signout method fails
   * @returns 
   */
  public async getActiveAccountDetails(): Promise<any> {
    const account = this._currentAccount$.value
    const accountId = account?.accountId
    // @TODO throw error
    if (!accountId) return 
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
    if(!this._currentAccount$.value) throw CannotDisconnectError.becauseAlreadyDisconnected();
    
    this.activeWalletConnection?.signOut()
    this.activeNearConnection = undefined
    // this.activeAccount$= undefined
    this._currentAccount$.next(null);
  }
}