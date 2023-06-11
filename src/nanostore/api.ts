import axios from 'axios';

export class NanoStoreBackendUrl {
	constructor(
	  private nanoStoreBackendUrl: string
	) {}
	public getUrl(): string {
	  return this.nanoStoreBackendUrl
	}
}


// Llamadas que requeriran de auth token
/* export const authApiCall = axios.create({
	withCredentials: true,
	baseURL: NANOSTORE_BACKEND_URL,
	headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
}); */

// Llamadas que no requeriran de auth token
export function anonApiCall(backendUrl: string) {
	return axios.create({
		baseURL: new NanoStoreBackendUrl(backendUrl).getUrl(),
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});
}

// Llamadas que no requeriran de auth token
/* export const uploadFileCall = axios.create({
	baseURL: NANOSTORE_BACKEND_URL,
	headers: {
		'Content-Type': 'multipart/form-data'
	}
}); */