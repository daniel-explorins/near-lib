import { MINTBASE_GRAPHQL_MAINNET, MINTBASE_GRAPHQL_TESTNET } from "./../constants";
import { NearNetwork, Network } from "./../types";

export const getGraphQlUri = (network: NearNetwork) => {
    switch(network) {
        case NearNetwork.mainnet:
            return MINTBASE_GRAPHQL_MAINNET;
            break;
        case NearNetwork.testnet:
            return MINTBASE_GRAPHQL_TESTNET;
            break;
        default:
            throw new Error('Unsupported network');
    }
}