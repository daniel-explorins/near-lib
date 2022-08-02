
import { API } from './api';

import { 
  Wallet as mintbaseWallet,
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

import { FACTORY_CONTRACT_NAME, MAINNET_CONFIG, STORE_CONTRACT_VIEW_METHODS, STORE_CONTRACT_CALL_METHODS, TESTNET_CONFIG } from './constants';


export class NearWallet {

  private config: any;
  public contractName: any;
  public account: any;

  public constructor(
    private apiKey: string,
    public networkName: Network = Network.testnet,
    public chain: Chain = Chain.near
  ) {
    switch(networkName) {
      case Network.mainnet:
        this.config = MAINNET_CONFIG;
        break;
      case Network.testnet:
        this.config = TESTNET_CONFIG;
        break;
      default:
        // TODO: Error unknown network
        break;
    }
  }

  // Usamos el objeto de mintbase para realizar la conexión
  public async mintbaseLogin() {
    console.log('mintbase Login enter ...');

    const myWallet = new mintbaseWallet();

    const { data: walletData, error } = await myWallet.init({
      networkName: this.networkName,
      chain: this.chain,
      apiKey: this.apiKey,
    });

    const { wallet, isConnected } = walletData;
    console.log('Wallet ...', wallet)

    if (isConnected) {
    } else {
      // Si no está conectada la wallet vamos a la página de conexión
      await myWallet.connect({ requestSignIn: true });
    }

    const {data: details} = await wallet.details();

    console.log('Details: ', details)

    this.contractName = details.contractName;

    console.log('contractName: ', this.contractName)

    // La account !!
    this.account = wallet.activeWallet?.account();
    console.log('Account: ', this.account)
    
    if (this.account) {
      const contract = new Contract(this.account, this.contractName, {
        viewMethods: STORE_CONTRACT_VIEW_METHODS,
        changeMethods: STORE_CONTRACT_CALL_METHODS,
      });

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

  public async nearLogin() {
    console.log('near Login enter ...');

    const _connectionObject = {
        deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() },
        headers: {
          'Content-Type': 'application/json',
        },
        ...this.config,
        contractName: this.networkName
      }

    const nearConnection = await connect(
      {
        ...this.config,
        contractName:
            FACTORY_CONTRACT_NAME,
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      }
    )

    

    
  }
}
