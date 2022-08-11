
import { API } from './api';

import { 
  Wallet as MintbaseWallet,
  Chain, 
  Network
} from 'mintbase';

import {
  keyStores,
  WalletAccount,
  KeyPair,
  Near,
  Account,
  utils,
  WalletConnection,
  connect,
  Contract
} from 'near-api-js';

import {
  NEARConfig,
} from './types'

import { 
  FACTORY_CONTRACT_NAME, 
  MAINNET_CONFIG, 
  STORE_CONTRACT_VIEW_METHODS, 
  STORE_CONTRACT_CALL_METHODS, 
  TESTNET_CONFIG 
} from './constants';
import { WalletConfig } from './mintbase-types';


export class MintbaseNearWallet {

  private networkConfig: any;

  // Name that give us access to contract
  public contractName: any;

  // User account
  public account: any;

// mintbaseWallet is the object that contains all mintbase methods and parameters
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
      networkName: this.networkName,
      chain: this.chain,
      apiKey: this.apiKey,
    };
  }

  /**
   * We use the mintbase object to make the connection so we can use its methods and properties
   */
  public async mintbaseLogin(): Promise<void> 
  {
    console.log('mintbase Login enter ...');
    
    try {
      await this.mintbaseWallet.init(this.mintbaseWalletConfig);
    } catch (error) {
      throw new Error('Error initializing mintbase');
    }

    if (!this.mintbaseWallet.isConnected) {
      // If the wallet is not connected, we go to the connection page
      await this.mintbaseWallet.connect({ requestSignIn: true });
    }
    const {data: details} = await this.mintbaseWallet.details();

    this.contractName = details.contractName;
    this.account = this.mintbaseWallet.activeWallet?.account();
    
    if (this.account) {
      const contract = new Contract(this.account, this.contractName, {
        viewMethods: STORE_CONTRACT_VIEW_METHODS,
        changeMethods: STORE_CONTRACT_CALL_METHODS,
      });

      console.log('Details: ', details)
      console.log('contractName: ', this.contractName)
      console.log('Account: ', this.account)
      console.log('El contract: ', contract);
    }
  }

  public async getMinters() {
    
    const contract = new Contract(this.account, this.contractName, {
      viewMethods: STORE_CONTRACT_VIEW_METHODS,
      changeMethods: STORE_CONTRACT_CALL_METHODS,
    });

    // @ts-ignore: method does not exist on Contract type
    const minters = await contract.list_minters();
    console.log('minters: ', minters);
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
}
