import 'isomorphic-unfetch'
import { MintbaseConstants, NearNetwork, Network } from '../types'
import { CLOUD_URI, API_VERSION } from '../constants'
import { retryFetch } from './retryFetch'

export const initializeExternalConstants = async ({
  apiKey,
  networkName,
}: {
  apiKey?: string
  networkName?: NearNetwork
}): Promise<MintbaseConstants> => {
  // Check if this value can change in the future
  const url = `${CLOUD_URI}/developer`
  const fetchOptions = {
    headers: {
      'api-key': apiKey || 'anonymous',
      'api-version': !networkName
        ? API_VERSION
        : `${API_VERSION}-${networkName}`,
    },
  }

  const response = await retryFetch(url, fetchOptions)

  return await response.json()
}
