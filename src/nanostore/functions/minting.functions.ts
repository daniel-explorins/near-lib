import { uploadReference } from '@mintbase-js/storage';
import { ReferenceObject } from '../interfaces';
import { NanostoreBackend } from '../nanostore.backend';
import { connect as nearConnect, ConnectedWalletAccount } from "near-api-js";


/**
   * @description Mint an nft that could be 3d printed
   * ---------------------------------------------------
   * @param imageFile 
   * @param stlFile 
   * @param numToMint 
   */
export async function mintToken(
    referenceObject: ReferenceObject,
    numToMint: number,
    backendUrl: string,
    account?: ConnectedWalletAccount,
  ) {
    const nanoStoreBackend = new NanostoreBackend(backendUrl)

    if(!account) throw new Error('No wallet Connected Account');
    // if(!this.isConnected()) throw new Error('Not logged'); 

    let responseUpload;

    try {
      responseUpload = await uploadReference(referenceObject);
    } catch (error: any) {
        console.log('error ', error)
      throw new Error('Mint storage error: ' + error.message);
    }

    try {
      const reference = responseUpload.id;
      const accountId = account.accountId
      return await nanoStoreBackend.mint(numToMint, accountId, reference, referenceObject.nano_id);
    } catch (error) {
        console.log('error ', error)
      throw new Error('Mint Backend error');
    }
  }