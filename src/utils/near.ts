import { NEARConfig, Network } from "./../types"

/**
 * Get NEAR configuration object. Defaults to testnet.
 * @param networkName
 * @param contractAddress
 */
export const getNearConfig = (
 networkName: Network,
 contractAddress: string
): NEARConfig => {
 switch (networkName) {
   case Network.testnet:
     return {
       networkId: 'testnet',
       nodeUrl: 'https://rpc.testnet.near.org',
       contractName: contractAddress ,
       walletUrl: 'https://wallet.testnet.near.org',
       helperUrl: 'https://helper.testnet.near.org',
     }

   case Network.mainnet:
     return {
       networkId: 'mainnet',
       nodeUrl: 'https://rpc.mainnet.near.org',
       contractName: contractAddress,
       walletUrl: 'https://wallet.near.org',
       helperUrl: 'https://helper.mainnet.near.org',
     }
   default:
     return {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        contractName: contractAddress ,
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
     }
 }
}