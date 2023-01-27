

/**
 * Utility string for recover stores. 
 * Fields returned in queries that use it. 
 */
export const storeGeneralQuery = `
        id
        name
        owner
        symbol
        baseUri
        minters {
            account
            enabled
        }
        things {
            id
            memo
            metaId
            tokens_aggregate {
                aggregate {
                count
                }
            }
        }
        tokens {
            id
            minter
            royaltys {
                account
                percent
                id
            }
            splits {
                id
                percent
                account
            }
            createdAt
            ownerId
        }
`
export const tokensGeneralQuery = `
base_uri
burned_receipt_id
burned_timestamp
copies
description
expires_at
extra
issued_at
last_transfer_receipt_id
last_transfer_timestamp
media
media_hash
metadata_id
mint_memo
minted_receipt_id
minted_timestamp
minter
nft_contract_created_at
nft_contract_icon
nft_contract_id
nft_contract_is_mintbase
nft_contract_name
nft_contract_owner_id
nft_contract_reference
nft_contract_spec
nft_contract_symbol
owner
reference
reference_blob
reference_hash
royalties
royalties_percent
splits
starts_at
title
token_id
updated_at
`

export const thingGeneralQuery = `
id
memo
metaId
storeId
metadata {
  document_hash
  document
  description
  title
  type
  visibility
  youtube_url
  animation_url
  animation_type
  animation_size
  animation_hash
  category
  external_url
  extra
  id
  media
  media_type
  media_hash
  tags
}
store {
  baseUri
  owner
  name
}
tokens {
  id
  ownerId
}
`