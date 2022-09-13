
import { API } from './api';
import { request, gql } from 'graphql-request'

import { 
  Wallet as MintbaseWallet,
  Chain, 
  Network
} from 'mintbase';

import {
  keyStores,
  connect,
  Contract,
  ConnectedWalletAccount
} from 'near-api-js';

import {
  NEARConfig, OptionalMethodArgs,
} from './types'

import { 
  FACTORY_CONTRACT_NAME, 
  MAINNET_CONFIG, 
  STORE_CONTRACT_VIEW_METHODS, 
  STORE_CONTRACT_CALL_METHODS, 
  TESTNET_CONFIG, 
  MAX_GAS,
  ONE_YOCTO,
  TWENTY_FOUR,
  MARKET_CONTRACT_VIEW_METHODS,
  MARKET_CONTRACT_CALL_METHODS
} from './constants';
import { WalletConfig } from './mintbase-types';
import { MintbaseGraphql } from './mintbase-graphql';
import { map, Observable, of } from 'rxjs';

/**
 * Object that contains the methods and variables necessary to interact with the near wallet
 */
export class MintbaseNearWallet {

  private networkConfig: any;

  public mintbaseGraphql: MintbaseGraphql|undefined;

  /** Name that give us access to contract */ 
  public contractName: string|undefined;

  /** Account key for connected user (you) */ 
  public account: ConnectedWalletAccount|undefined;

  /** mintbaseWallet is the object that contains all mintbase methods and parameters */
  private mintbaseWallet: MintbaseWallet;
  private mintbaseWalletConfig: WalletConfig;
  
  /**
   * @param {string} apiKey 
   * @param {Network} networkName - default value is 'testnet'
   * @param {Chain} chain - default value is 'near'
   */
  public constructor(
    private apiKey: string,
    public networkName = Network.testnet,
    public chain = Chain.near
  ) {
    switch(networkName) {
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
      apiKey: apiKey,
    };
  }

  public async getDetails() {
    const {data: details} = await this.mintbaseWallet.details();
    return details;
  }

  /**
   * We use the mintbase object to make the connection so we can use its methods and properties
   */
  public async mintbaseLogin(): Promise<void> 
  {
    console.log('mintbase Login enter pruebas ...', this.mintbaseWalletConfig);
    
    
    const { data: walletData, error } = await this.mintbaseWallet.init(this.mintbaseWalletConfig);
    const { wallet, isConnected } = walletData;

    if (!isConnected) {
      // If the wallet is not connected, we go to the connection page
      await this.mintbaseWallet.connect({ requestSignIn: true });
    }

    const {data: details} = await this.mintbaseWallet.details();

    this.contractName = details.contractName;
    this.account = this.mintbaseWallet.activeWallet?.account();
    this.mintbaseGraphql = new MintbaseGraphql(this.mintbaseWallet.api?.apiBaseUrl);

    
    if (this.account) {
      const contract = new Contract(this.account, details.contractName, {
        viewMethods: STORE_CONTRACT_VIEW_METHODS,
        changeMethods: STORE_CONTRACT_CALL_METHODS,
      });

      console.log('Details: ', details);
      console.log('contractName: ', details.contractName);
      console.log('Account: ', this.account);
      console.log('El contract: ', contract);
      console.log('El wallet: ', this.mintbaseWallet);
    }
  }

  public disconnect() {
    this.mintbaseWallet.activeWallet?.signOut()
    this.mintbaseWallet.activeNearConnection = undefined
    this.mintbaseWallet.activeAccount = undefined
  }

  public isLoggedIn(): Observable<boolean> {
    return of(this.mintbaseWallet.isConnected());
  }

  /**
   * Transfer one token.
   * @param {string} tokenId The token id to transfer.
   * @param {string} receiverId The account id to transfer to.
   * @param {string} contractName The contract name to transfer tokens from.
   */
  public async transferToken(
    tokenId: string,
    gas = MAX_GAS
  ): Promise<any> {

    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId;
    const contractName = this.mintbaseWallet.activeNearConnection?.config.contractName;

//console.log('contractName: ', contractName);
//console.log('account: ', account)

    if (!account || !accountId) {
      throw new Error('Account is undefined.' );
    }
      
    if (!contractName){
      throw new Error('No contract name was provided.' )
    }

    const contract = new Contract(account, contractName, {
      viewMethods:
        this.mintbaseWallet.constants.STORE_CONTRACT_VIEW_METHODS ||
        STORE_CONTRACT_VIEW_METHODS,
      changeMethods:
        this.mintbaseWallet.constants.STORE_CONTRACT_CALL_METHODS ||
        STORE_CONTRACT_CALL_METHODS,
    })

    console.log('Contract para comprar: ', contract)

    // @ts-ignore: method does not exist on Contract type
    await contract.nft_transfer({
      args: { receiver_id: accountId, token_id: tokenId },
      gas: gas,
      amount: ONE_YOCTO,
    });
  }

  public async getMyThings(myStoreId: string) {
    return await this.mintbaseGraphql?.getStoreThings(myStoreId)
  }

  public async makeOffer(
    tokenId: string,
    price: string ,
    storeId?: string,
    options?: OptionalMethodArgs & {
      marketAddress?: string
      timeout?: number
    }
  ): Promise<any> {
    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId
    const gas =  MAX_GAS;
    const timeout = options?.timeout || TWENTY_FOUR

    if (!account || !accountId) return 'Account is undefined.'
    if (!tokenId) return  'Please provide a tokenId';
    if(!storeId) return 'Must provide a storeId';

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
        token_key: [tokenId+":"+storeId], //  ["0:amber_v2.tenk.testnet"],
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
      throw new Error('Account is undefined.' );
    }
      
    if (!contractName){
      throw new Error('No contract name was provided.' )
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
    console.log('near Login enter ...');

    const _connectionObject = {
        deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() },
        headers: {
          'Content-Type': 'application/json',
        },
        ...this.networkConfig,
        contractName: this.networkName
      }

    const nearConnection = await connect(
      {
        ...this.networkConfig,
        contractName:
            FACTORY_CONTRACT_NAME,
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      }
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
    if(response) return response.data;
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
    if(response) return response.data.store;
    else throw new Error('Marketplace cannot be accessed.')
  }

  /** Search and retrieve your near store in mintbase platform */
  public async getMyStores( ) {
    const myStores =  await this.mintbaseGraphql?.getStoreByOwner(this.account?.accountId);
    return myStores;
  }

  /**
   * 
   * @param storeId 
   * @returns 
   */
  public async getTokensOfStoreId( storeId: string ) {
    return await this.mintbaseGraphql?.getTokensOfStoreId(storeId)
  }

  
  public async fetchStoreById(
    storeId: string
  ) {
    const response = await this.mintbaseWallet.api?.fetchStoreById(storeId);
    if(response) return response.data;
    else throw new Error('Store cannot be accessed.')
  }
}
