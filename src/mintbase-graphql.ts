import { request, gql } from 'graphql-request'
import { from, Observable, tap } from 'rxjs';
import urlcat from 'urlcat';
import { API_BASE_NEAR_TESTNET } from './constants';
import { storeGeneralQuery, thingGeneralQuery } from './utils/graphQuery';
import { MintbaseThing } from '@explorins/types';

export class MintbaseGraphql {

  public apiBaseUrl: string;


  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl ?? API_BASE_NEAR_TESTNET;
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
   * implementación en graphql de ex-ts-lib
   * @param thingId 
   * @param itemOffset 
   * @param itemLimit 
   * @returns 
   */
  public getThingStream(
    thingId: string, 
    itemOffset: number = 0, 
    itemLimit: number = 1000
  ): Observable<any>
  {
    return from(this.getThingById(thingId)).pipe(
      tap(ev => console.log('getThingStream method: ', ev))
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
    const url = urlcat(this.apiBaseUrl, '/v1/graphql')

    try {
      const data = await request(url, query, variables)
      return data;
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  

  public async getStoreByOwner(owner: string|undefined) {
    if(!owner) throw new Error('Owner not provided.');

    const query = gql`
    {
      store(where: {owner: {_eq: "${owner}"}}) {
        id
      }
    }
  `;

    const response = await this.custom( query ) as any;
    console.log('getStoreByOwner response: ', response)
    if(response) return response?.store;
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
   * implementación en graphql de ex-ts-lib
   * @link thingGeneralQuery
   */
   public async getThingById(thingId: string|undefined) {
    if(!thingId) throw new Error('Store Id not provided.');
    console.log('thingId: ', thingId)
    const query = gql`
    {
      thing(where: {id: {_eq: "${thingId}"}}) {
        ${thingGeneralQuery}
      }
    }
  `;

    const response = await this.custom( query ) as any;
    console.log('getThingById response: ', response)
    if(response) return response?.thing[0];
    else throw new Error('My store cannot be accessed.')
  }

  /**
   * implementación en graphql de ex-ts-lib
   * @param storeId 
   * @returns 
   */
   public async getItemsById(
    thingIds: string[] | null = null, 
    showListedOnly: boolean = true,
    itemOffset: number = 0, 
    itemLimit: number = 1000
  ): Promise<MintbaseThing[]> {
      const query = gql`
        {
          thing(
            where: {
              id: {
                _in: "${thingIds}"
              },
              tokens: {
                list: {
                  removedAt: {
                    _is_null: ${showListedOnly}
                  }
                }
              }
            }, 
            limit: ${itemLimit}, 
            offset: ${itemOffset}
          )
          {
            ${thingGeneralQuery}
          }
        }
      `;
      const response = await this.custom(
          query
        ) as any;

      console.log('getStoreItems response: ', response);
      if(response) return response.thing;
      else throw new Error('My store cannot be accessed.')
    }

  /**
   * implementación en graphql de ex-ts-lib
   * @param storeId 
   * @returns 
   */
  public async getStoreItems(
    storeId: string,
    showListedOnly: boolean = true,
    itemOffset: number = 0, 
    itemLimit: number = 1000
  ): Promise<MintbaseThing[]> {
      const query = gql`
        {
          thing(
            where: {
              storeId: {
                _eq: "${storeId}"
              }, 
              tokens: {
                list: {
                  removedAt: {
                    _is_null: ${showListedOnly}
                  }
                }
              },
            }, 
            limit: ${itemLimit}, 
            offset: ${itemOffset}
          )
          {
            ${thingGeneralQuery}
          }
        }
      `;
      const response = await this.custom(
          query
        ) as any;

      console.log('getStoreItems response: ', response);
      if(response) return response.thing;
      else throw new Error('My store cannot be accessed.')
    }

  /**
   * 
   * @param storeId 
   * @returns 
   */
  public async getTokensOfStoreId(
    storeId: string
  ) {
    const query = gql`
    {
      nft_tokens(where: {nft_contract_id: {_eq: "${storeId}"}}) {
        metadata_id
        token_id
        nft_listings {
          price
        }
      }
    }
    `;
    const response = await this.custom( query ) as any;
    console.log('getTokensOfStoreId response: ', response)
  
    if(response) return response.data?.nft_tokens;
    else throw new Error('Tokens cannot be accessed.')
  }

  /**
   * 
   * @param storeId 
   * @returns 
   */
  public async getStoreThings(storeId: string) {
    const query = gql`
    {
      mb_views_store_things(where: {storeId: {_eq: "${storeId}"}}) {
        createdAt
        listed
        media
        storeId
        thingId
        title
      }
    }
  `;

  const response = await this.custom(
      query
    ) as any;

    console.log('getStoreThings response: ', response);
    if(response) return response.mb_views_store_things;
    else throw new Error('My store cannot be accessed.')
  }
}