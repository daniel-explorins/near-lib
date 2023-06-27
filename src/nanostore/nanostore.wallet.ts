import { Observable, filter, firstValueFrom, map, shareReplay, tap } from "rxjs";
import { CannotConnectError } from "../error";
import { AccountState, NearNetwork } from "../types";
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
  

  private walletSelectorState$ = this.walletConnector.walletSelectorState$
  public currentAccount$: Observable<AccountState | null> = this.walletSelectorState$.pipe(
    map((state) => {
      if(!state) return null;
      return state.accounts.find((account) => account.active) || null
    }),
    tap((account) => console.log('account: ', account)),
    shareReplay(1)
  )

  /** External public observable to login state */
  public isLogged$ = this.currentAccount$
  .pipe(
    map((account) => {
      if(!account) return false;
      return true
    }),
    tap((isLogged) => console.log('isLogged: ', isLogged)),
    shareReplay(1)
    );

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

    /* switch (networkName) {
      case NearNetwork.mainnet:
        this.configData = NANOSTORE_MAINNET_CONFIG
        break;
      case NearNetwork.testnet:
        
        this.configData = NANOSTORE_TESTNET_CONFIG
        break;
      default:
        throw CannotConnectError.becauseUnsupportedNetwork();
    } */

    // this.init();
  }

  /**
   * @description check if wallet is connected
   * @returns 
   */
  /* public isConnected(): boolean {

    if(!this.activeWalletConnection) return false;
    return this.activeWalletConnection.isSignedIn() ?? false

  } */

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
    /* this.constants = await initializeExternalConstants({
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
    } */
    // TODO: get env from backend
    /* const keyStore = new keyStores.BrowserLocalStorageKeyStore();
    this.keyStore = keyStore;
    const _connectionObject = {
      deps: { keyStore },
      ...this.configData!
    } */

    // If the wallet is not connected, we go to the connection page
    /* const near = await nearConnect(_connectionObject);
    this.activeNearConnection = near;
    // Este es el objeto connection
    this.activeWalletConnection = new WalletConnection(near, APP_KEY_PREFIX);
 */
    /* if(this.activeWalletConnection.isSignedIn()) {
      console.log('Im connected ... ')
    
    } else {
      // this.setCurrentAccount(null);
      console.log('Im not connected ... ')
      const isAsyncSignedIn = await this.activeWalletConnection?.isSignedInAsync()
    } */

  }

  // TODO: only for admin
  public async deployStore(symbol: string, storeName: string) {
    const account = await firstValueFrom(this.currentAccount$)
    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()
    await deployStore(symbol, account, storeName)
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
    const account = await firstValueFrom(this.currentAccount$)
    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()

    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()
    if(!this.backendUrl) throw CannotConnectError.becauseNoBackendUrl()
    return await mintToken(referenceObject, numToMint, this.backendUrl, account)
  }

  public async listTokenForSale(token_id: string, price: number, marketplaceHostNearAccount: string) {
    
    const account = await firstValueFrom(this.currentAccount$)
    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()
    const wallet = await firstValueFrom(this.walletConnector.wallet$)

    return await deposit_and_set_price(token_id, price, account, this.contractId, wallet, marketplaceHostNearAccount)
  }

  // TODO: open for token on other contract??
  public async purchaseToken(token_id: string, price: string, marketplaceHostNearAccount: string) {
    const account = await firstValueFrom(this.currentAccount$)
    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()
    const wallet = await firstValueFrom(this.walletConnector.wallet$)
 
    await purchaseToken(token_id, price, this.contractId, wallet, account, marketplaceHostNearAccount)
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
  ) {
    const account = await firstValueFrom(this.currentAccount$)
    if(!account) throw CannotConnectError.becauseMintbaseLoginFail()
    const wallet = await firstValueFrom(this.walletConnector.wallet$)
    

    if(!this.backendUrl) throw CannotConnectError.becauseNoBackendUrl()
    return await initPrintToken(tokenId, nearReference, productId, printingFee, printerId, this.contractId, this.backendUrl, account, wallet)
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
  /* public async getActiveAccountDetails(account: any): Promise<any> {
    // const account = this.ConnectedWalletAccount
    const accountId = account.accountId
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
  } */


  /**
   * @description Do signOut, clean local variables and update logged observable
   * ------------------------------------------------------------------------------------
   * @throws {CannotDisconnectError} if mintbase signout method fails
   */
  public disconnect(): void 
  {

    this.walletConnector.signOut()
  }
}