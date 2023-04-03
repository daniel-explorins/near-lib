import BN from 'bn.js'
import { MetadataField } from 'mintbase';

export const CLOUD_URI = 'https://us-central1-omni-live.cloudfunctions.net';
export const API_VERSION = '1'

export const MINTBASE_GRAPHQL_MAINNET = 'https://mintbase-mainnet.hasura.app/';
export const MINTBASE_GRAPHQL_TESTNET = 'https://mintbase-testnet.hasura.app/';

export const BASE_ARWEAVE_URI = 'https://arweave.net'

export const DEFAULT_APP_NAME = 'Mintbase.js'
export const NEAR_LOCAL_STORAGE_KEY_SUFFIX = '_wallet_auth_key'

export const NANOSTORE_FACTORY_CONTRACT_NAME = 'nanostore3.testnet'

export const FACTORY_CONTRACT_NAME = 'mintspace1.testnet'

export const STORE_CONTRACT_VIEW_METHODS = [
  'list_minters'
]

export const STORE_CONTRACT_CALL_METHODS = [
  'nft_batch_mint',
  'nft_batch_approve',
  'nft_approve',
  'grant_minter',
  'revoke_minter',
  'burn_tokens',
  'nft_revoke_all',
  'nft_revoke',
  'nft_batch_burn',
  'nft_batch_transfer',
  'nft_transfer',
  'set_icon_base64',
  'set_base_uri',
  'transfer_store_ownership',
  'new',
  'batch_change_minters'
]

export const DEFAULT_ROYALTY_PERCENT = 1000

export const MAX_GAS = new BN('300000000000000') // 2x10^14 (pasem al màxim gas permés 3x10^14)
export const ONE_YOCTO = new BN('1')
export const ZERO = new BN('0')
export const DEPLOY_STORE_COST = new BN('10500000000000000000000000')

export const VALID_FILE_FORMATS: { [key: string]: string[] } = {
  [MetadataField.Media]: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
  [MetadataField.Animation_url]: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'audio/ogg',
    'video/webm',
    'video/mp4',
    'audio/mpeg',
    'audio/mp3',
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream',
  ],
  [MetadataField.Document]: ['application/pdf'],
}

export const FILE_UPLOAD_SIZE_LIMIT = 31457280 // 30MB

export const TWENTY_FOUR = 24
export const SEVENTY_TWO = 72

export const MINTBASE_32x32_BASE64_DARK_LOGO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEXUlEQVRYR8VXW4hVVRj+vrX3OYbFNBl2eSsoa8pkxMJmzpGGoIwMY0wwImuCXmKKkiikKayHQIpAwbdAswskBYqJSlANek7TUOPURGKCWdmFkJnsoZnhzNn/F2vcZ9gez2UfEVoP+2Gv///Xt771X4mUq6enpz2Kogck3S2pk+R1ki736iT/kfQzyW/N7PNsNrtvcHDwTBrTbCbU1dV1cxiGGyWtA3BJM/l4f1rSLjPbPDQ0dKyRTl0AS5YsubStre11AP0AwiYHi+SJmJGFCdmypG3T09MDIyMjk7Vs1ASQy+VuIrkbQEezG3vqJfXGTzHhnFtlZttIuoTuUQC9hULheLW98wDkcrnbARwkeWWzw+P9ewCsB/AYgBkz6yW5lmRfUl/SOMmVhUJhJPn/HAD+5gCKLRzubS0AMO59MTa828z2Oud2VF8gBtGdZGIOQPzmX6ehPWk4iqKOIAg+BnCr/y/pJUmnnHPv1WHw6NTU1B0Vn5gDkM/ntwB4NiXtc2KS9kdR1B+G4aMA/pD0kaQHGwDwILcUi8UNs37jPz7UgiD4PoW318Qn6QSA/STbJc2T9EkjAAB8dCwuFos/zgLI5/M7YydqlYBa8vvMbFcTAJ6FncVisY/5fP4KT10LSaYZyFQAAEyHYXitB+BD6N1mVlvYTwsAZraeuVxuR3XMNjpM0mFJW0n+VUfub0mnSS6S5JxznQBeBpDMkBXV7R7AKEkv1HRJGiLpvX0rgHYzGyB5S5yuZ/VJHioUCv25XO4Vn/0AHDCzD51z35DMViWnUf8EEwC8H6RZj5O8Py5M3pF+D4JghZn9lFDeB+AtAF9U/vmw9CBJ3lt1yIQHYIks1gzEapJPSlodJ53xcrncmclkTiUOOwRgM8n9iX8Pk/S+tqqKAWsZgJmddM6971kzs+f9W5P0VbOyZmZmZjyo5yStcc4djKJoE8kxkvNrAWjlCVZLugHAYefcpJmtIzkAIKii7ldJL5jZkTAMF0t6A8CNNeidaMkJAXjqNwLobvZWafYljbYahhcVAIDtrSaiiwpgNhGlSMVjAI5J8m3Xm3FILapD8UKSd9XwiVriZ1Ox36lXjCRtMLPPwjC8s1QqHRgeHv6tu7v7IefcNYkQG8tkMqPlcnmNrylm9q9z7lMAlzXyg7li5IXqlOOvADwN4EsAPoOdLpVKHdlsdm/SCUku8/UdwIo4NzxF8noALzYAcG45jlmobkjelnTc014xRPI+Sa8BWJ4w7lsyH8qVtUfSHpLv1ANwXkPiBWu0ZEeiKOoLgsAzMd+nXTNb7pz7geTsQBLfuIvkqwBWnu3I9ASAZSSfqQOgdkvmhaubUpKboij6IAiCpSSH/aAB4JEqw9+VSqXeTCZzm6Q/nXNXA/A94rxqAA2b0opwjbb8JADfzy8FcFWdW01K8kwtqFdZU7XlCRCpB5M0GQ9A+sGkYrDF0awejgsbzZLW/rfhtPpKTcbzM5J+uZDx/D8+0FUx/4DhyAAAAABJRU5ErkJggg=='
