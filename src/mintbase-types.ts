export enum Chain {
    near = 'near',
}
  
export enum Network {
    mainnet = 'mainnet',
    testnet = 'testnet',
}
  
export interface NEARConfig {
    networkId: string
    nodeUrl: string
    contractName: string
    walletUrl: string
    helperUrl: string
}

export interface WalletConfig {
    apiKey: string
    chain?: Chain
    networkName?: Network
  }