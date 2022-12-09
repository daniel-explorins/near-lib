export default {
    CONNECT: {
        USER_NOT_FOUND: '0101',
        MINTBASE_LOGIN: '0102',
        USUPPORTED_NETWORK: '0103',
        MINTBASE_NOT_CONNECTED: '0104',
        MINTBASE_ERROR: '0105'
    },
    DISCONNECT: {
        MINTBASE_ERROR: '0201',
        MINTBASE_NOT_CONNECTED: '0202',
        ALREADY_DISCONNECTED: '0203'
    },
    TRANSFER_TOKEN: {
        ACCOUNT_NOT_FOUND: '0301',
        CONTRACT_NOT_FOUND: '0302',
        TRANSACTION_FAILS: '0303',
        MINTBASE_NOT_CONNECTED: '0304'
    },
    CONTRACT: {
        USER_NOT_FOUND: '0401',
        MINTBASE_NOT_CONNECTED: '0402',
        MINTBASE_ERROR: '0403',
        CONTRACT_NAME_NOT_FOUND: '0404',
        NEAR_ERROR: '0405'
    },
    GET_TOKEN: {
        MINTBASE_NOT_CONNECTED: '0501',
        TIMEOUT_ERROR: '0502'
    },
    MAKE_OFFER: {
        USER_NOT_FOUND: '0601',
        TOKEN_NOT_FOUND: '0602',
        STORE_NOT_FOUND: '0603',
        MINTBASE_NOT_CONNECTED: '0604',
        MINTBASE_ERROR: '0605'
    },
    FETCH_STORE: {
        MINTBASE_NOT_CONNECTED: '0701',
        MINTBASE_ERROR: '0702',
        GRAPHQL_ERROR: '0703'
    },
    FETCH_THINGS: {
        MINTBASE_NOT_CONNECTED: '0801',
        MINTBASE_ERROR: '0802'
    },
    GET_MINTERS: {
        MINTBASE_NOT_CONNECTED: '0901',
        MINTBASE_ERROR: '0902',
        CONTRACT_ERROR: '0903'
    },
    FETCH_MARKETPLACE: {
        MINTBASE_NOT_CONNECTED: '1001',
        MINTBASE_ERROR: '1002'
    },
}