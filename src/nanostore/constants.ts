import { MintMetadata } from "mintbase";

export const NANOSTORE_CONTRACT_NAME = 'storepruebas1.nanostore.testnet'; // 'nanostore_store.dev-1675363616907-84002391197707'

export const NANOSTORE_CONTRACT_OWNER = "nanostore.testnet";
// Only for develop purposes
export const NANOSTORE_PRIVATE_KEY = 'ed25519:2RXaSjUUKduXEe7omGqdxZd19qgjA7dg1nXn7AN74321RKVW7a2EPCaeKrucEKknLgryRSoynM37UBmwGLqcmbN8';

export const NANOSTORE_TESTNET_CONFIG = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  contractName: NANOSTORE_CONTRACT_NAME,
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
  headers: {
    "Content-Type": "application/json",
  },
};

export const NANOSTORE_MAINNET_CONFIG = {
  networkId: "mainnet",
  nodeUrl: "https://rpc.mainnet.near.org",
  contractName: NANOSTORE_CONTRACT_NAME,
  walletUrl: "https://wallet.mainnet.near.org",
  helperUrl: "https://helper.mainnet.near.org",
  explorerUrl: "https://explorer.mainnet.near.org",
  headers: {
    "Content-Type": "application/json",
  },
};

export enum MetadataField {
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

  export enum MetadataFieldExtension {
    Printable = 'printable'
  };
  
  export interface Metadata extends MintMetadata {
    [MetadataFieldExtension.Printable]?: boolean
  };

  export const NANOSTORE_CONTRACT_VIEW_METHODS = [
    'list_minters',
    'list_printers',
    'check_is_minter',
    'get_owner'
  ]
  
  export const NANOSTORE_CONTRACT_CALL_METHODS = [
    'nft_batch_mint',
    'nft_batch_print',
    'nft_deposit_print',
    'nft_batch_approve',
    'grant_printer',
    'nft_approve',
    'grant_minter',
    'revoke_minter',
    'burn_tokens',
    'nft_revoke_all',
    'nft_revoke',
    'nft_batch_burn',
    'nft_batch_transfer',
    'nft_transfer',
    'set_icon_base64',
    'set_base_uri',
    'transfer_store_ownership',
    'new',
    'batch_change_minters'
  ]