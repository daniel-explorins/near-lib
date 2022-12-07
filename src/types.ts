import { DisplayType, MetadataField, Constants, MintMetadata, Royalties, Token } from 'mintbase';
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
  API_VERSION?: string
  API_BASE_NEAR_MAINNET?: string
  API_BASE_NEAR_TESTNET?: string
  BASE_ARWEAVE_URI?: string
  FACTORY_CONTRACT_NAME?: string
  MARKET_ADDRESS?: string
  STORE_CONTRACT_VIEW_METHODS?: string[]
  STORE_CONTRACT_CALL_METHODS?: string[]
  MARKET_CONTRACT_VIEW_METHODS?: string[]
  MARKET_CONTRACT_CALL_METHODS?: string[]
  FACTORY_CONTRACT_VIEW_METHODS?: string[]
  FACTORY_CONTRACT_CALL_METHODS?: string[]
  CLOUD_STORAGE_CONFIG?: CloudStorageConstants
  DEFAULT_ROYALTY_PERCENT?: number
  FILE_UPLOAD_SIZE_LIMIT?: number
}

interface CloudStorageConstants {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  storageBucket: string
}

export interface WalletConfig {
  apiKey: string
  chain?: Chain
  networkName?: Network
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

interface Attribute {
  trait_type: string
  display_type?: DisplayType
  value: string | number
}

enum MetadataFieldExtension {
  Printable = 'printable'
};

interface Metadata extends MintMetadata {
  [MetadataFieldExtension.Printable]?: boolean
};

type MetadataFields = MetadataFieldExtension | MetadataField;


type OptionalMethodArgs = {
  gas?: string
  amount?: string
  meta?: string
  callbackUrl?: string
}

type WalletConnectProps = {
  successUrl?: string
  failureUrl?: string
}

type NearTransaction = Transaction & {
  functionCalls: FunctionCall[]
}

export {
  MintbaseConstants,
  NearWalletDetails,
  NearToken,
  Account,
  Visibility,
  Attribute,
  MetadataFields,
  Metadata,
  NearRoyalties,
  CloudStorageConstants,
  OptionalMethodArgs,
  WalletConnectProps,
  NearTransaction
}
