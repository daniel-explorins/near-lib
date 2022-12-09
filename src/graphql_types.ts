export interface GetTokensOfStoreId {
  metadata_id: string,
  token_id: string,
  nft_listings: {
    price: string
  }
}

export interface GetStoreByOwner {
  id: string
}