import { AxiosInstance } from "axios";
import { anonApiCall } from "./api";
import { BackendMintTokenRequest } from "./interfaces";

export class NanostoreBackend {

  anonApiCall: AxiosInstance // = anonApiCall();
  constructor(
    private backendUrl: string
  ) {
    this.anonApiCall = anonApiCall(backendUrl)
  }  /**
   * @description Mint an nft that could be 3d printed
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
        this.anonApiCall.post("/product/near/mint", req)
        .then(({ data, status }) => {
          resolve(data);
        })
        .catch((error) => { reject(error) })
    });
  }

  /**
   * @description Print an nft
   * ------------------------
   * @param tokenId
   * @param nearReference
   * @param productId
  */
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
		  this.anonApiCall.post("/print-event/print", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

  /**
   * @description Register a new new print deposit
   * @param tokenId 
   * @param nearReference 
   * @param productId 
   * @param fee 
   * @param owner 
   * @param printerId 
   * @returns 
   */
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
		  this.anonApiCall.post("/print-event/register-deposit", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { 
        reject(error) 
      })
	  });
  }

  /** 
   * @description register a deposit paid to print
   * ---------------------------------------------
   * @param tokenId
   * @param nearReference
   * @param productId
   * @param owner
   * @param transactionHashes
   * @returns 
  */
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
		  this.anonApiCall.post("/print-event/confirm-deposit", body)
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

}