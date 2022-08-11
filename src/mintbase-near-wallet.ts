
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
  NEARConfig, OptionalMethodArgs,
} from './types'

import { 
  FACTORY_CONTRACT_NAME, 
  MAINNET_CONFIG, 
  STORE_CONTRACT_VIEW_METHODS, 
  STORE_CONTRACT_CALL_METHODS, 
  TESTNET_CONFIG, 
  MAX_GAS,
  ONE_YOCTO
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
      networkName: networkName,
      chain: chain,
      apiKey: apiKey,
    };
  }

  /**
   * We use the mintbase object to make the connection so we can use its methods and properties
   */
  public async mintbaseLogin(): Promise<void> 
  {
    console.log('mintbase Login enter pruebas ...');
    
    
    const { data: walletData, error } = await this.mintbaseWallet.init(this.mintbaseWalletConfig);
    const { wallet, isConnected } = walletData;

    if (!isConnected) {
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

  public disconnect() {
    this.mintbaseWallet.activeWallet?.signOut()
    this.mintbaseWallet.activeNearConnection = undefined
    this.mintbaseWallet.activeAccount = undefined
  }

  /**
   * Transfer one token.
   * @param {string} tokenId The token id to transfer.
   * @param {string} receiverId The account id to transfer to.
   * @param {string} contractName The contract name to transfer tokens from.
   */
  public async simpleTransfer(
    tokenId: string,
    receiverId: string,
    contractName: string,
    gas = MAX_GAS
  ): Promise<any> {

    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId

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
    await contract.nft_transfer({
      args: { receiver_id: receiverId, token_id: tokenId },
      gas: gas,
      amount: ONE_YOCTO,
    });
  }

  /**
   * Este método "list_minters" está en la documentación de mintbase, pero no existe ??
   */
  public async getMinters() {
    
    const contract = new Contract(this.account, this.contractName, {
      viewMethods: STORE_CONTRACT_VIEW_METHODS,
      changeMethods: STORE_CONTRACT_CALL_METHODS,
    });

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
}
