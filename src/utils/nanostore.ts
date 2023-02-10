import { ConnectedWalletAccount } from "near-api-js";

/**
 * @description
 * -------------------------------------
 * @param accountId 
 * @param network 
 * @returns {string}
 */
export const getStoreNameFromAccount = (
    account: ConnectedWalletAccount
): string => {
    const storeId = account.accountId.replace('.' + account.connection.networkId, '');
    return storeId.replace(/[^a-z0-9]+/gim, '').toLowerCase();
    
  }