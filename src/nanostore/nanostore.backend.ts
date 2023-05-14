import { anonApiCall, uploadFileCall } from "./api";
import { BackendMintTokenRequest } from "./interfaces";

export class NanostoreBackend {   
  /**
   * @TODO Llama al backend
   */
  /* public payPrintedToken(file: File, metadataId: string, creator: string) {
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
  } */

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

      const req: BackendMintTokenRequest = {
        nanoId: nanoId,
        amount: numToMint,
        creator: owner,
        nearReference: reference
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
    tokenId: string,
    nearReference: string,
    productId: string,
  ) {
    const body = {
      tokenId, 
      nearReference,
      productId
    }
    return new Promise((resolve, reject) => {
		  anonApiCall.post("/print-event/print", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

  public async registerDepositToPrint(
    tokenId: string,
    nearReference: string,
    productId: string,
    fee: string,
    owner: string,
    printerId: string
  ) {
    const body = {
      tokenId,
      nearReference,
      productId,
      printerId,
      fee,
      owner
    }
    return new Promise((resolve, reject) => {
		  anonApiCall.post("/print-event/register-deposit", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { 
        reject(error) 
      })
	  });
  }

  public async registerDepositPaidToPrint(
    tokenId: string,
    nearReference: string,
    productId: string,
    owner: string,
    transactionHashes: string
  ) {
    // TODO: el printer está hardcoded
    const body = {
      tokenId,
      nearReference,
      productId,
      owner,
      transactionHashes
    }
    return new Promise((resolve, reject) => {
		  anonApiCall.post("/print-event/confirm-deposit", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

}