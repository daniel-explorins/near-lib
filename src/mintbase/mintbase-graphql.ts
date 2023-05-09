import { request, gql } from 'graphql-request'
import { from, Observable, tap } from 'rxjs';
import urlcat from 'urlcat';
import { storeGeneralQuery, thingGeneralQuery, tokensByOwnerQuery, tokensGeneralQuery } from '../utils/graphQuery';
// Hay que probar de limpiar esta dependencia
import { GetStoreByOwner, GetTokensOfStoreId } from '../graphql_types';
import { MintbaseThing } from './../types';
import { GRAPHQL_ENDPOINTS } from '@mintbase-js/sdk';

export class MintbaseGraphql {

  public apiBaseUrl: string;


  constructor() {
    this.apiBaseUrl = GRAPHQL_ENDPOINTS['testnet'];
    // console.log('this.apiBaseUrl -------------------------', this.apiBaseUrl)
  }

  /**
   * implementación en graphql de ex-ts-lib
   * @param storeId 
   * @param itemOffset 
   * @param itemLimit 
   * @returns {Observable}
   */
   public getStoreStream(
    storeId: string, 
    itemOffset: number = 0, 
    itemLimit: number = 1000
  ): Observable<any>
  {
    return from(this.getStoreById(storeId,itemOffset, itemLimit)).pipe(
      tap(ev => console.log('getStoreStream response: ', ev))
    );
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

  

  public async getStoreByOwner(
    owner: string
  ): Promise<GetStoreByOwner> 
  {
    const query = gql`
    {
      store(where: {owner: {_eq: "${owner}"}}) {
        id
      }
    }
  `;

    const response = await this.custom( query ) as any;
    
    if(response && response.store) return response.store;
    else throw new Error('My store cannot be accessed.')
  }

  /**
   * implementación en graphql de ex-ts-lib
   * @link storeGeneralQuery
   * @param storeId 
   * @param itemOffset 
   * @param itemLimit 
   * @returns 
   */
  public async getStoreById(
    storeId: string|undefined,
    itemOffset: number = 0,
    itemLimit: number = 1000
  ) {
    if(!storeId) throw new Error('Store Id not provided.');

    const query = gql`
    {
      store(where:{id: {_eq: "${storeId}"}}) {
        things(limit: ${itemLimit}, offset: ${itemOffset})
        ${storeGeneralQuery}
      }
    }
  `;

    const response = await this.custom( query ) as any;
    console.log('getStoreById response: ', response)
    if(response) return response?.store;
    else throw new Error('My store cannot be accessed.')
  }


  /**
   * @description
   * @param storeId 
   * @returns 
   */
  public async getTokensOfStoreId(
    storeId: string
  ): Promise<GetTokensOfStoreId>{
    const query = gql`
    {
      nft_tokens(where: {nft_contract_id: {_eq: "${storeId}"}}) {
        metadata_id
        token_id
      }
    }
    `;
    const response = await this.custom( query ) as any;
  
    if(response && response.nft_tokens) return response.nft_tokens;
    else throw new Error('Tokens cannot be accessed.')
  }

  /**
   * 
   * @param storeId 
   * @returns 
   */
  public async getWalletThings(walletId?: string): Promise<MintbaseThing[]> {
    const query = gql`
    {
      thing(where: {store: {name: {_eq: "${walletId}"}}}) {
        ${thingGeneralQuery}
      }
    }
  `;

  const response = await this.custom(
      query
    ) as any;

    if(response) return response.thing;
    else throw new Error('My store cannot be accessed.')
  }

  /**
   * @description
   * ---------------------------------------------------------------
   * @param storeId 
   * @returns 
   * @throws Custom Error if cannot get data
   */
  public async getTokensFromContract(
    offset: number,
    limit: number,
    contractName: string
  ): Promise<any[]> {
    const query = gql`{
      mb_views_nft_tokens(
        where: {nft_contract_id: {_eq: "${contractName}"}}
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
   * @description
   * ---------------------------------------------------------------
   * @param storeId 
   * @returns 
   * @throws Custom Error if cannot get data
   */
  public async getTokensFromContractAndOwner(
    offset: number,
    limit: number, 
    contractName: string,
    ownerId: string
  ): Promise<any[]> {
    
    const query = gql`{
      mb_views_nft_tokens(
        where: {
          nft_contract_id: {_eq: "${contractName}"},
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
}