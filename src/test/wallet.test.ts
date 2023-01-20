import nock from 'nock';
import { API_BASE_NEAR_TESTNET } from './../constants';
import { MintbaseGraphql } from './../mintbase/mintbase-graphql';
import 'isomorphic-unfetch';
import { thingByIdMock } from './mocks';

export const graphqlNearMock = nock(`${API_BASE_NEAR_TESTNET}/v1/graphql`);
export const arweaveMock = nock('https://arweave.net');

/**
 * Tests pending definition and development
 */
describe('api', () => {
    const Graphql = new MintbaseGraphql();
  
    test('thingById: should return thingByIdMock', async () => {
      const thingId = 'id'
      graphqlNearMock.get(`/things/${thingId}`).reply(200, thingByIdMock)
  
      const result = await Graphql.getItemsById();
  
      expect(result).toStrictEqual(thingByIdMock);
    })
  })