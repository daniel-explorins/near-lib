### La función batch_mint del contrato recibe:
```typescript
    owner_id: AccountId,
    metadata: TokenMetadata,
    num_to_mint: u64,
    royalty_args: Option<RoyaltyArgs>,
    split_owners: Option<SplitBetweenUnparsed>
```

### Para llamarla hacemos:

```typescript
await contract.nft_batch_mint({
    meta: options?.meta,
    callbackUrl: options?.callbackUrl,
    args: obj,
    gas: gas,
    amount: ONE_YOCTO,
})
```
### donde hemos seguido las especificaciones propias de la libreria near-api
```typescript
await contract.method_name(
  {
    callbackUrl: 'https://example.com/callback', // callbackUrl after the transaction approved (optional)
    meta: 'some info', // meta information NEAR Wallet will send back to the application. `meta` will be attached to the `callbackUrl` as a url search param
    args: {
        arg_name: "value" // argument name and value - pass empty object if no args required
    },
    gas: 300000000000000, // attached GAS (optional)
    amount: 1000000000000000000000000 // attached deposit in yoctoNEAR (optional)
  }
);
```
### donde los args se correponderian a los parámetros que espera recibir el contrato

```typescript
const args = {
      owner_id: accountId,
      metadata: {
        reference: thing.reference,
        extra: memo,
      },
      num_to_mint: amount,
      royalty_args: royaltys
        ? {
            split_between: royaltys,
            percentage: royaltyPercent,
          }
        : null,
      split_owners: thing.splits,
    }
```

### por otro lado se define el tipo de dato "metadata" como:
```typescript
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
```

### Donde nos interesa sobretodo el campo ***extra***
### este campo es un array con el formato para sus elementos:
```typescript
interface Attribute {
  trait_type: string
  display_type?: DisplayType
  value: string | number
}
```

### donde Displaytype es un enum:
```typescript
enum DisplayType {
  boostNumber = 'boost_number',
  boostPercentage = 'boost_percentage',
  number = 'number',
  date = 'date',
  location = 'location',
  website = 'website',
  zoom = 'zoom',
  placeId = 'place_id',
  rarity = 'rarity',
  youtubeUrl = 'youtube_url',
  latitude = 'latitude',
  longitude = 'longitude',
}
```