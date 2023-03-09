import { MintMetadata } from "mintbase";

export const NANOSTORE_CONTRACT_NAME = 'nanostore_store.dev-1675363616907-84002391197707';
// Only for develop purposes
export const NANOSTORE_PRIVATE_KEY = 'ed25519:2vJ2QNSgeuEJCtmpEnsywqpTpvqEfKo9Ysac7AeFLRUzYJJmMfCNyg6DTtX27RePCUTK9dXxLZ3bw7ERdGV8zCVA';

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
    'list_minters'
  ]
  
  export const NANOSTORE_CONTRACT_CALL_METHODS = [
    'nft_batch_mint',
    'nft_batch_approve',
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