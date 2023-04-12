import { anonApiCall } from "./api";

export class NanostoreBackend {

    
  /**
   * @TODO Llama al backend
   */
  public payPrintedToken(tokenId: string) {
    return new Promise((resolve, reject) => {
		anonApiCall.get("/marca/all")
			.then(({ data, status }) => {
				resolve(data);
			})
			.catch((error) => { reject(error) })
	});
  }

}