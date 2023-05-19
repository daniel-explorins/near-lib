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
  public async getAllStoreActiveListingsTokens( 
    offset: number = 0, 
limit: number = 10
): Promise<any>
{
  if(!this.nanostoreGraphql) throw  new Error('Graphql is not defined')
  
  try {
    // TODO: filter on sale tokens only
    return await this.nanostoreGraphql.getAllStoreActiveListingsTokens(offset,limit);
  } catch (e) {
    console.log(e);
    throw new Error('Graphql error.' + e);
  }
  
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
      try {
        return await this.nanostoreGraphql.getAllStoreTokens(offset,limit);
      } catch (e) {
        console.log(e);
        throw new Error('Graphql error.');
      }
      
    }

    /**
     * @description gets token by reference 
     * ------------------------------------------------------------------------------------
     * @param reference
     * @throws {CannotGetTokenError}
     * @returns {Promise<any>}
     * 
     * @example 
     */
    public async getTokenByReference(reference: string): Promise<any> {
      if(!this.nanostoreGraphql) throw  new Error('Graphql is not defined')
      try {
          return await this.nanostoreGraphql.getTokenByReferenceId(reference);
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
  public async getAccountTokens(account: ConnectedWalletAccount, offset = 0, limit = 1000) {

    // const account = this.activeWalletConnection?.account();
    if(!account) throw new Error('No account defined');
    const accountId = account.accountId;
    return await this.nanostoreGraphql.getTokensFromOwner(accountId, offset, limit);

  }

}