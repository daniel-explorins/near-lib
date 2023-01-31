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

enum MetadataFieldExtension {
  Printable = 'printable'
};

interface Metadata extends MintMetadata {
  [MetadataFieldExtension.Printable]?: boolean
};


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

enum MetadataField {
  Id = 'id',
  Title = 'title',
  Category = 'category',
  Description = 'description',
  Media = 'media',
  Media_hash = 'media_hash',
  Tags = 'tags',
  Image_preview = 'imagePreview',
  Copies = 'copies',
  Extra = 'extra',
  External_url = 'external_url',
  Background_color = 'background_color',
  Animation_url = 'animation_url',
  Animation_hash = 'animation_hash',
  Youtube_url = 'youtube_url',
  UpdatedAt = 'updated_at',
  Document = 'document',
  Document_hash = 'document_hash',
  Lock = 'lock',
  Visibility = 'visibility',
  Chain = 'chain',
  Store = 'store',
  Royalty = 'royalty',
  Royalty_perc = 'royalty_perc',
  SplitRevenue = 'split_revenue',
}

export {
  MintbaseConstants,
  NearWalletDetails,
  NearToken,
  Account,
  Visibility,
  MetadataField,
  Metadata,
  NearRoyalties,
  CloudStorageConstants,
  OptionalMethodArgs,
  NEARConfig,
  ConstructNearWalletParams,
  NearTransaction,
  NearNetwork,
  NanostoreNetwork
}
