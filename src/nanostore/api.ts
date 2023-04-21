import axios from 'axios';
import { NANOSTORE_BACKEND_URL } from './constants';

// Llamadas que requeriran de auth token
export const authApiCall = axios.create({
	withCredentials: true,
	baseURL: NANOSTORE_BACKEND_URL,
	headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
});

// Llamadas que no requeriran de auth token
export const anonApiCall = axios.create({
	baseURL: NANOSTORE_BACKEND_URL,
	headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
});

// Llamadas que no requeriran de auth token
export const uploadFileCall = axios.create({
	baseURL: NANOSTORE_BACKEND_URL,
	headers: {
		'Content-Type': 'multipart/form-data'
	}
});