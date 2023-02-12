import { NEARConfig, NearNetwork, Network } from "./../types"

/**
 * Get NEAR configuration object. Defaults to testnet.
 * @param networkName
 * @param contractAddress
 */
export const getNearConfig = (
 networkName: NearNetwork|Network,
 contractAddress: string
): NEARConfig => {
 switch (networkName) {
   case NearNetwork.testnet:
     return {
       networkId: 'testnet',
       nodeUrl: 'https://rpc.testnet.near.org',
       contractName: contractAddress ,
       walletUrl: 'https://wallet.testnet.near.org',
       helperUrl: 'https://helper.testnet.near.org',
     }

   case NearNetwork.mainnet:
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

export const JsonToUint8Array = function(json: Object)
{
	var str = JSON.stringify(json, null, 0);
	var ret = new Uint8Array(str.length);
	for (var i = 0; i < str.length; i++) {
		ret[i] = str.charCodeAt(i);
	}
	return ret
};

export const calculateListCost = (amount: number): number => {
  const cost = 0.0144 * amount
  return cost
}