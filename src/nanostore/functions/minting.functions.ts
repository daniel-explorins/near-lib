import { uploadReference } from '@mintbase-js/storage';
import { ReferenceObject } from '../interfaces';
import { NanostoreBackend } from '../nanostore.backend';
import { connect as nearConnect, ConnectedWalletAccount } from "near-api-js";

const nanoStoreBackend = new NanostoreBackend();

function getReferenceObject(
    title: string,
    description: string,
    // TODO set category type
    category: string,
    tags: {[key: string]: string}[],
    imageFile: File,
    extras: {[key: string]: string}[],
):ReferenceObject {
    const referenceObject: ReferenceObject = {
        title: title,
        description: description,
        //for the media to be uploaded to arweave it must be contained in one of these 3 fields
        media: imageFile,
        category: category,
        tags: tags,
        // Esto se guardará en el backend
        extra: extras // {trait_type: "material1 - prueba2", value: 5}, {trait_type: "material2 - prueba2", value: 11}, {trait_type: "material3 - prueba2", value: 10}
      }
    return referenceObject;

}

/**
   * @description
   * ---------------------------------------------------
   * @param imageFile 
   * @param stlFile 
   * @param numToMint 
   */
export async function mint(
    referenceObject: ReferenceObject,
    stlFile: File,
    numToMint: number,
    fileName: string,
    account?: ConnectedWalletAccount,
  ) {

    if(!account) throw new Error('No wallet Connected Account');
    // if(!this.isConnected()) throw new Error('Not logged'); 

    let responseUpload;

    

    try {
      responseUpload = await uploadReference(referenceObject);
    } catch (error) {
      throw new Error('Mint storage error');
    }

    try {
      const reference = responseUpload.id;
      const accountId = account.accountId
      await nanoStoreBackend.mint(stlFile, numToMint, accountId, reference, fileName);
    } catch (error) {
      throw new Error('Mint Backend error');
    }
  }


  /**
     * @description Mint an nft that could be 3d printed
     * Legacy method
     * ------------------------------------------------------------------------------------
     * @param {ConnectedWalletAccount} account
     * @throws {CannotMint3DToken} code: 1013 - If contract call or creation throws eror
     */
  /* public async mintByLoggedUser(
    file: File, 
    printerFile: File,
    numToMint: number
  ): Promise<void> {

    if(!this.activeWalletConnection) throw new Error('No activeWallet Connection defined');
    
    const referenceObject: ReferenceObject = {
      title: 'proves 1',
      description: 'proves 2',
      //for the media to be uploaded to arweave it must be contained in one of these 3 fields
      media: file,
      category: 'proves 3',
      tags: [{tag1 : "tag prueba 1"}],
      // Esto se guardará en el backend
      extra: [{trait_type: "material1 - prueba2", value: 5}, {trait_type: "material2 - prueba2", value: 11}, {trait_type: "material3 - prueba2", value: 10}]
    }
    
    const response = await uploadReference(referenceObject);

    const meta = JSON.stringify({
        type: 'mint',
        args: {
            contractAddress: NANOSTORE_CONTRACT_NAME,
            amount: numToMint
        }
    });

      // Ejecutamos el contrato con la cuenta logeada (app user)
      const account = this.activeWalletConnection.account();
      let contract;
      
      try {
          // NANOSTORE contract interaction
          contract = new Contract(
              account, 
              NANOSTORE_CONTRACT_NAME,
              {
                  viewMethods: NANOSTORE_CONTRACT_VIEW_METHODS,
                  changeMethods: NANOSTORE_CONTRACT_CALL_METHODS
              }
          );
      } catch (error) {
          throw CannotMint3DToken.becauseContractError();
      }

      try {
          // @ts-ignore: method does not exist on Contract type
          const mintResponse = await contract.nft_batch_mint({
          meta,
          callbackUrl: "",
          args: {
              owner_id: account.accountId,
              metadata: {
                  reference: response.id,
                  extra: 'Nanostore testnet'
              },
              // @TODO: Que hacemos con esto ?
              royalty_args: null,
              num_to_mint: numToMint
          },
          gas: MAX_GAS,
          amount: ONE_YOCTO,
          });

          
          this.nanostoreBackend.payPrintedToken(file, 'loco', 'aww');

      } catch (error) {
          throw CannotMint3DToken.becauseContractError();
      }
  } */