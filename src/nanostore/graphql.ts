import { GRAPHQL_ENDPOINTS } from "@mintbase-js/sdk";
import request, { gql } from "graphql-request";
import urlcat from "urlcat";

import { tokensByOwnerQuery, tokensGeneralQuery } from "../utils/graphQuery";
import { NANOSTORE_CONTRACT_NAME } from "./constants";
import { tokensByOwnerQueryResponse } from "./interfaces";

export class NanostoreGraphql {

    public apiBaseUrl: string;
  
  
    constructor() {
      this.apiBaseUrl = GRAPHQL_ENDPOINTS['testnet'];
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
          nft_contract_id: {_eq: "${NANOSTORE_CONTRACT_NAME}"},
          owner: {_eq: "${ownerId}"}
        }
        offset: ${offset}
        limit: ${limit}
      ) {
        ${tokensByOwnerQuery}
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
   * @description
   * ---------------------------------------------------------------
   * @returns 
   * @throws Custom Error if cannot get data
   */
  public async getAllTokens(
    offset: number,
    limit: number
  ): Promise<any[]> {
    
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
   * Makes custom GraphQL query
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