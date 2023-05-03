import { CannotConnectError } from "./../error";
import { NearNetwork } from "./../types";
import { NanostoreGraphql } from "./graphql";
import { connect as nearConnect, ConnectedWalletAccount } from "near-api-js";

export class Nanostore {
    // Public acces to graphQl queries
    public nanostoreGraphql: NanostoreGraphql;

     /**
   * @MF TODO: Move initialization from constructor to static public method ?
   * @description The constructor only sets three variables: apiKey, networkName and mintbaseWallet
   * ------------------------------------------------------------------------------------
   * // TODO: remove? @param {string} apiKey - mintbase apikey 
   * @param {Network} networkName - default value is 'testnet'
   * @throws {CannotConnectError} if network is unrecognized
   */
     public constructor(
        // private apiKey: string,
        public networkName: NearNetwork
      ) {
        // MintbaseWallet is required for use this library
        // First of all we set mintbaseWalletConfig
        switch (networkName) {
          case NearNetwork.mainnet:
              
            break;
          case NearNetwork.testnet:
              
            break;
          default:
            throw CannotConnectError.becauseUnsupportedNetwork();
        }
        this.nanostoreGraphql = new NanostoreGraphql(networkName);
      }

      /**
   * TODO: check retryFetch logic
   * TODO: type token returned
   * @description Returns all the tokens minted with nanostore contract
   * ------------------------------------------------------------------------------------
   * @param offset
   * @param limit
   * @throws {CannotGetTokenError}
   */
    public async getAllTokensFromNanostore( 
        offset: number = 0, 
		limit: number = 10
    ): Promise<any>
    {
      if(!this.nanostoreGraphql) throw  new Error('Graphql is not defined')
      /* New mintbase lib example

      const {data , error} = await fetchGraphQl({
        query: QUERIES.storeNftsQuery,
        variables: {
          condition: {
            nft_contract_id: { _in: NANOSTORE_CONTRACT_NAME }
          },
          limit: 12,
          offset: 0,
        },
        network: 'testnet'
      });
      */
      try {
        return await this.nanostoreGraphql.getAllTokens(offset,limit);
      } catch ($e) {
        throw new Error('Graphql error.');
      }
      
    }

    /**
     * @description
     * ------------------------------------------------------------------------------------
     */
    public getGraphQlObject() {
        if(!this.nanostoreGraphql) throw  new Error('Graphql is not defined')
        return this.nanostoreGraphql;
    }


    /**
   * @description
   * ------------------------------------------------------------------------------------
   * @returns 
   */
  public async getAccountTokens(account: ConnectedWalletAccount) {

    // const account = this.activeWalletConnection?.account();
    if(!account) throw new Error('No account defined');
    const accountId = account.accountId;

    return await this.nanostoreGraphql.getTokensFromOwner(accountId);

  }

}