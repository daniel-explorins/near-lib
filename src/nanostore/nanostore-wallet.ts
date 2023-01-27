import { Contract, ConnectedWalletAccount, keyStores, connect, Near, WalletAccount, ConnectConfig, KeyPair, Account } from "near-api-js";
import { ConstructNearWalletParams, NEARConfig } from "./../types";
import { 
  MAX_GAS,
  ONE_YOCTO,
  STORE_CONTRACT_CALL_METHODS,
  STORE_CONTRACT_VIEW_METHODS,
  TWENTY_FOUR } from "./../constants";
import { NANOSTORE_CONTRACT_NAME } from "./constants";
import * as utils from './../utils/near';
import { isBrowser, isNode } from "browser-or-node";
import { BehaviorSubject, shareReplay } from "rxjs";
import { cannotGetMintersError } from "./../error";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class NanostoreWallet {
    public connectConfig: ConnectConfig|null = null;

    public properties: ConstructNearWalletParams;

    public activeNearConnection: any;

    public activeWallet: any;

    public activeAccount: Account|null = null;

    private nearWalletConfig: NEARConfig;

    /** Internal subject that stores login state */
    public _isLogged$ = new BehaviorSubject(false);

    /** External public observable to login state */
    public isLogged$ = this._isLogged$.asObservable().pipe(shareReplay());

    public constructor( 
      props: ConstructNearWalletParams
    ) { 
      // Setting config object
      this.nearWalletConfig = utils.getNearConfig(
        props.network, 
        props.contractAddress
      );  
      this.properties = props;
    }

    /**
     * @description This method initializes nanostore contract wallet object
     * @set 
     * connectConfig: 
     * activeNearConnection
     * ------------------------------------------------------------------------------------
     */
    public async init() {
        if (!isBrowser) throw new Error('Node connection is not permited yet');
        const connectConfig = {
            deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() },
            headers: {
                'Content-Type': 'application/json',
            },
            ...this.nearWalletConfig
        }
        
        const near = await connect(connectConfig);
        this.activeNearConnection = near;
        this.activeWallet = new WalletAccount(near, 'nanostore');

        if (this.activeWallet.isSignedIn()) {

            this._isLogged$.next(true);
            const accountId = this.activeWallet.getAccountId();
            this.activeAccount = await this.activeNearConnection.account(accountId);

        } else {

            this._isLogged$.next(false);
            this.activeAccount = null;

        }
    }

    /**
     * @description Creates a connection to a NEAR smart contract
     * ------------------------------------------------------------------------------------
     * @param props wallet connection properties - the config to create a connection with
     */
    public async connect( ): Promise<any> {
        if(this.activeWallet.isSignedIn()) {
            console.log('Already connected.');
            console.log('Account: ', this.activeAccount);
            console.log('La config: ', this.activeNearConnection?.config);
            // Already connected
        } else {
            this.activeWallet.requestSignIn({
            contractId: this.properties.contractAddress,
            successUrl: this.properties.successUrl,
            failureUrl: this.properties.failureUrl,
            });
            const accountId = this.activeWallet.getAccountId()
            this.activeAccount = await this.activeNearConnection.account(accountId)
        }
    }

    /**
     * @description minters for the entire nanostore contract
     * ------------------------------------------------------------------------------------
     */
    public async getMinters(): Promise<any> {
        const account = this.activeWallet?.account()
        const accountId = this.activeWallet?.account().accountId

        if (!account || !accountId) throw cannotGetMintersError.becauseMintbaseNotConnected();

        const contract = new Contract(
            account,
            NANOSTORE_CONTRACT_NAME,
            {
                viewMethods: STORE_CONTRACT_VIEW_METHODS,
                changeMethods:  STORE_CONTRACT_CALL_METHODS
            }
        );
        try {
            // @ts-ignore: method does not exist on Contract type
            const minters = await contract.list_minters();
            return minters;
        } catch (error) {
            throw cannotGetMintersError.becauseContractError();
        }
    }

    /**
     * @description
     * ------------------------------------------------------------------------------------
     * @param {ConnectedWalletAccount} account
     * @returns 
     */
    public async getStoreMinters(account: ConnectedWalletAccount) {
        try {
            const contract = new Contract(
            account, 
            NANOSTORE_CONTRACT_NAME,
            {
                viewMethods: STORE_CONTRACT_VIEW_METHODS,
                changeMethods: STORE_CONTRACT_CALL_METHODS
            }
            );
            // @ts-ignore: method does not exist on Contract type
            const minters = await contract.list_minters();
            return minters;
            
        } catch (error) {
            console.log('a error ocurred !');
        }
    }

    

 
}