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
    stlFile: File, 
    numToMint: number, 
    owner: string,
    reference: string,
    fileName: string
  ) {

    
    const formData = new FormData();
    formData.append("file", stlFile, fileName);
    formData.append("numToMint", numToMint.toString());
    formData.append("owner", owner);
    formData.append("reference", reference);
    formData.append("originalName", fileName);

    return new Promise((resolve, reject) => {
		  uploadFileCall.post("/near-product/mint", formData)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

  public async print(
    tokenId: string,
    reference: string
  ) {
    const body = {tokenId, reference}
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
    owner: string
  ) {
    const body = {tokenId, printerId: 'printernanostore.testnet', fee, owner}
    return new Promise((resolve, reject) => {
		  anonApiCall.post("/print-event/deposit", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

}