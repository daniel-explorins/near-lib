

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