import axios from 'axios';
import { NANOSTORE_BACKEND_URL } from './constants';

const API_URL = NANOSTORE_BACKEND_URL;

// Llamadas que requeriran de auth token
export const authApiCall = axios.create({
	withCredentials: true,
	baseURL: API_URL,
	headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
});

// Llamadas que no requeriran de auth token
export const anonApiCall = axios.create({
	baseURL: API_URL,
	headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
});