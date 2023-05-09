import { uploadReference } from "@mintbase-js/storage";
import { anonApiCall, uploadFileCall } from "./api";
import { ReferenceObject } from "./interfaces";

export class NanostoreBackend {

    
  /**
   * @TODO Llama al backend
   */
  public payPrintedToken(file: File, metadataId: string, creator: string) {
    const formData = new FormData();
    formData.append("file", file, 'nanoname');
    formData.append("metadataId", metadataId);
    formData.append("creator", metadataId);

    return new Promise((resolve, reject) => {
		uploadFileCall.post("/near-product", formData)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

  /**
   * @description
   * ------------------------------------------------
   * @param stlFile 
   * @param numToMint 
   * @param owner 
   * @param reference 
   * @returns 
   */
  public async mint(
    numToMint: number, 
    owner: string,
    reference: string,
    nanoId: string
  ) {

      const req = {
        nanoId: nanoId,
        amount: numToMint,
        creator: owner,
        reference: reference
      }
      return new Promise((resolve, reject) => {
        anonApiCall.post("/product/near/mint", req)
        .then(({ data, status }) => {
          console.log('data ', data)
          resolve(data);
        })
        .catch((error) => { reject(error) })
    });
  }

  /* private getMintFormData(
    // stlFile: File,
    numToMint: number,
    owner: string,
    reference: string,
    // fileName: string
  ) {
    const formData = new FormData();
    // formData.append("file", stlFile, fileName);
    formData.append("amount", numToMint.toString());
    formData.append("owner", owner);
    formData.append("reference", reference);
    // formData.append("originalName", fileName);

    return formData;
  } */

  public async print(
    tokenId: string
  ) {
    const body = {tokenId, reference: 'fake'}
    return new Promise((resolve, reject) => {
		  anonApiCall.post("/print-event", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

  public async registerDepositToPrint(
    tokenId: string,
    fee: string,
    owner: string,
    printerId: string
  ) {
    // TODO: el printer está hardcoded
    const body = {tokenId, printerId, fee, owner}
    return new Promise((resolve, reject) => {
		  anonApiCall.post("/print-event/deposit", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

  public async registerDepositPayedToPrint(
    tokenId: string
  ) {
    // TODO: el printer está hardcoded
    const body = {tokenId}
    return new Promise((resolve, reject) => {
		  anonApiCall.post("/print-event/deposit-payed", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

}