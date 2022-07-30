
import { API } from './api';

import { Wallet, Chain, Network} from 'mintbase';
import {Contract} from 'near-api-js';
import { STORE_CONTRACT_CALL_METHODS } from './constants';


export class WalletConnection {

  async login() {
    console.log('Login enter ...')

    const myWallet = new Wallet();

    const { data: walletData, error } = await myWallet.init({
      networkName: Network.testnet,
      chain: Chain.near,
      apiKey: '903f511b-ea65-445a-a03f-0da99b149854',
    })

    const { wallet, isConnected } = walletData;
    console.log('Wallet ...', wallet)

    if (isConnected) {
    } else {
      await myWallet.connect({ requestSignIn: true });
    }

    const {data: details} = await wallet.details();

    console.log('Details: ', details)

    const contractName = details.contractName;

    // La account !!
    const account = wallet.activeWallet?.account();
    console.log('Account: ', account)
    
    if (account) {
      const contract = new Contract(account, contractName, {
        viewMethods: [],
        changeMethods: STORE_CONTRACT_CALL_METHODS,
      });

      console.log('EL contract: ', contract)
    }
  }
}
