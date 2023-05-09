export interface tokensByOwnerQueryResponse {
    burned_receipt_id: string,
    copies: number,
    description: string,
    extra: string,
    media: string,
    media_hash: string,
    metadata_id: string,
    reference: string,
    reference_blob: Object,
    reference_hash: string,
    title: string,
    token_id: string,
  }

export type ReferenceObject = any & {
  title?: string;
  description?: string;
  //for the media to be uploaded to arweave it must be contained in one of these 3 fields
  media?: File;
  animation_url?: File;
  document?: File;
  //
  attributes?: any[];
  category?: string;
  tags?: string[];
  extra?: any[] | any;
}

export type ArweaveResponse = {
  // Arweave hash. Concatenate 'https://arweave.net/' with the id to retrieve the file. See above an explanation of how Arweave works.
  id: string;
  // Arweave block. See above an explanation of how Arweave works.
  block: string;
  // The file's name.
  name: string;
  // The file's content type.
  mimeType: string;
}