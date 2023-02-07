import { Constants, MintMetadata, Royalties, Token } from 'mintbase';
import { FunctionCall, Transaction } from 'near-api-js/lib/transaction'

/** Lib only works with near */
export enum Chain {
  near = 'near',
}


export enum Network {
  mainnet = 'mainnet',
  testnet = 'testnet',
}
export interface NetworkConfig {
  networkId: string,
  nodeUrl: string
  walletUrl: string
  helperUrl: string,
  explorerUrl: string,
  // TODO: improve this type
  headers: { [key: string]: string | number; }
}

interface MintbaseConstants extends Constants {

}

interface CloudStorageConstants {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  storageBucket: string
}

export interface MintbaseWalletConfig {
  apiKey: string
  chain: Chain
  networkName: Network
}

interface NearWalletDetails {
  accountId: string
  balance: string
  allowance: string
  contractName: string
}

interface NearToken extends Token {
  creator: string
}

interface NearRoyalties extends Royalties {
  [creator: string]: number
}

interface Account {
  id: string
}

enum Visibility {
  nsfw = 'nsfw',
  safe = 'safe',
}


enum NearNetwork { 
  testnet = 'testnet',
  mainnet = 'mainnet'
}

type NanostoreNetwork = Network | NearNetwork;

type OptionalMethodArgs = {
  gas?: string
  amount?: string
  meta?: string
  callbackUrl?: string
}

interface NEARConfig {
  networkId: string
  nodeUrl: string
  contractName: string
  walletUrl: string
  helperUrl: string
}

type ConstructNearWalletParams = {
  network: NearNetwork,
  contractAddress: string,
  successUrl?: string,
  failureUrl?: string
}

type NearTransaction = Transaction & {
  functionCalls: FunctionCall[]
}

export interface MintbaseThing {
  id: string;
  memo: string;
  metaId: string;
  storeId: string;
  metadata: MintbaseNftMetadata;
  tokens: MintbaseThingToken[];
  store: MintbaseStore;
}

export interface MintbaseThingToken {
  id: string;
  ownerId: string;
}

export interface MintbaseStore {
  baseUri: string;
  id?: string;
  minters?: any[];
  name?: string;
  owner: string;
  symbol?: string;
  things: any[];
}

export interface MintbaseNftMetadata {
  title: string;
  description: string;
  media: string;
  media_hash: string;
  animation_hash: string;
  animation_url: string;
  youtube_url: string;
  document: any;
  document_hash: any;
  extra: any;
  external_url: string;
  category: string;
  type: string;
  visibility: string;
  media_type: string;
  animation_type: string;
  tags: any;
  media_size: number;
  animation_size: number;
}

export {
  MintbaseConstants,
  NearWalletDetails,
  NearToken,
  Account,
  Visibility,
  NearRoyalties,
  CloudStorageConstants,
  OptionalMethodArgs,
  NEARConfig,
  ConstructNearWalletParams,
  NearTransaction,
  NearNetwork,
  NanostoreNetwork
}
