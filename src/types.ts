import { MetadataField, Constants, MintMetadata, Royalties, Token, Network } from 'mintbase';
import { FunctionCall, Transaction } from 'near-api-js/lib/transaction'

/** Lib only works with near */
export enum Chain {
  near = 'near',
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

enum NearNetwork { 
  testnet = 'testnet',
  mainnet = 'mainnet',
  mintbase_testnet = 'mintbase_testnet',
  mintbase_mainnet = 'mintbase_mainnet'
};

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
  MetadataFields,
  Metadata,
  NearRoyalties,
  CloudStorageConstants,
  OptionalMethodArgs,
  WalletConnectProps,
  NearTransaction,
  NearNetwork
}
