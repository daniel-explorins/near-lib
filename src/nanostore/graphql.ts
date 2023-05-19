import { GRAPHQL_ENDPOINTS } from "@mintbase-js/sdk";
import request, { gql } from "graphql-request";
import { CannotConnectError } from "./../error";
import { NearNetwork } from "./../types";

import { tokensGeneralQuery, tokensListedQuery } from "../utils/graphQuery";
import { NANOSTORE_CONTRACT_NAME } from "./constants";
import { tokensByOwnerQueryResponse } from "./interfaces";

export class NanostoreGraphql {

    public apiBaseUrl: string;
  
      /**
   * @description The constructor only sets one variables: networkName
   * ------------------------------------------------------------------------------------
   * @param {NearNetwork} networkName 
   * @throws {CannotConnectError} if network is unrecognized
   */
  
    constructor(
      private networkName: NearNetwork,
    ) {
      switch (networkName) {
        case NearNetwork.mainnet:
            
          break;
        case NearNetwork.testnet:
            
          break;
        default:
          throw CannotConnectError.becauseUnsupportedNetwork();
      }
      this.apiBaseUrl = GRAPHQL_ENDPOINTS[networkName];
    }

    /**
     * @description get token by reference id
     * ---------------------------------------------------------------
     * @param referenceId
     * @returns
     */
    public async getTokenByReferenceId(referenceId: string): Promise<any> { 
      const query = gql`{
        mb_views_nft_tokens(
          where: {
            nft_contract_id: {_eq: "${NANOSTORE_CONTRACT_NAME}"}
            reference: {_eq: "${referenceId}"}
          }
        ) {
          ${tokensGeneralQuery}
        }
      }
    `;
    
      const response = await this.custom(
        query
      ) as any;
      if(response && response.mb_views_nft_tokens) return response.mb_views_nft_tokens[0];
      else throw new Error('My store cannot be accessed.')
    }

    /**
     * @description
     * ---------------------------------------------------------------
     * @param ownerId 
     * @returns {Promise<tokensByOwnerQueryResponse[]>}
     * @throws Custom Error if cannot get data
     */
    public async getTokensFromOwner(
        ownerId: string,
        offset: number = 0,
        limit: number = 10
    ): Promise<tokensByOwnerQueryResponse[]> {
    const query = gql`{
      mb_views_nft_tokens(
        where: {
          nft_contract_id: {_eq: "${NANOSTORE_CONTRACT_NAME}"}
          owner: {_eq: "${ownerId}"}
        }
        offset: ${offset}
        limit: ${limit}
      ) {
        ${tokensGeneralQuery}
      }
    }
  `;

    const response = await this.custom(
      query
    ) as any;

    if(response && response.mb_views_nft_tokens) return response.mb_views_nft_tokens;
    // @TODO custom graphql errors
    else throw new Error('My store cannot be accessed.')
  }

  /**
  * @description custom graphql request
  * ---------------------------------------------------------------
  * @param offset
  * @param limit
  * @returns 
  * @throws Custom Error if cannot get data
  */
  public async getAllStoreActiveListingsTokens(
    offset: number,
    limit: number
  ): Promise<any[]> {
    
    const query = gql`{
      mb_views_active_listings(
        where: {nft_contract_id: {_eq: "${NANOSTORE_CONTRACT_NAME}"}}
        offset: ${offset}
        limit: ${limit}
      ) {
        ${tokensListedQuery}
      }
    }
  `;

    const response = await this.custom(
      query
    ) as any;

    if(response && response.mb_views_active_listings) return response.mb_views_active_listings;
    else throw new Error('My store cannot be accessed.')
  }



  /**
   * @description
   * ---------------------------------------------------------------
   * @param offset
   * @param limit
   * @returns 
   * @throws Custom Error if cannot get data
   */
  public async getAllStoreTokens(
    offset: number,
    limit: number
  ): Promise<any[]> {
    
    // TODO filter on sale tokens only
    const query = gql`{
      mb_views_nft_tokens(
        where: {nft_contract_id: {_eq: "${NANOSTORE_CONTRACT_NAME}"}}
        offset: ${offset}
        limit: ${limit}
      ) {
        ${tokensGeneralQuery}
      }
    }
  `;

    const response = await this.custom(
      query
    ) as any;

    if(response && response.mb_views_nft_tokens) return response.mb_views_nft_tokens;
    else throw new Error('My store cannot be accessed.')

  }

  /**
   * @description Makes custom GraphQL query
   * ---------------------------------------------------------------
   * @param query custom GraphQL query
   * @param variables object with variables passed to the query
   * @returns result of query
   */
  public async custom<T>(
    query: string,
    variables?: unknown
  ): Promise<T> {

    try {
      const data = await request(this.apiBaseUrl, query, variables)
      return data;
    } catch (error: any) {
      throw new Error(error.message)
    }
  }
}