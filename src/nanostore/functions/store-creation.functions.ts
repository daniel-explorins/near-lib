import { OptionalMethodArgs } from "./../../types";
import { ConnectedWalletAccount, Contract } from "near-api-js";
import { DEPLOY_STORE_COST, MAX_GAS, MINTBASE_32x32_BASE64_DARK_LOGO, NANOSTORE_FACTORY_CONTRACT_NAME } from "./../../constants";
import { NANOSTORE_FACTORY_CONTRACT_CALL_METHODS, NANOSTORE_FACTORY_CONTRACT_VIEW_METHODS } from "../constants";
import { getStoreNameFromAccount } from "./../../utils/nanostore";

/**
   * @description Creates a store. For future developments.
   * ------------------------------------------------------------------------------------
   * @param storeId Store name
   * @param symbol Store symbol
   */
export async function deployStore(
    symbol: string,
    account?: ConnectedWalletAccount,
    options?: OptionalMethodArgs & { attachedDeposit?: string; icon?: string }
  ): Promise<boolean> {
    
    const accountId = account?.accountId

	if (!account || !accountId) throw new Error('Undefined account');

    const gas = MAX_GAS;

    const contract = new Contract(
      account,
      NANOSTORE_FACTORY_CONTRACT_NAME,
      {
          viewMethods: NANOSTORE_FACTORY_CONTRACT_VIEW_METHODS,
          changeMethods: NANOSTORE_FACTORY_CONTRACT_CALL_METHODS
      }
    )

    const storeData = {
      owner_id: accountId,
      metadata: {
        spec: 'nft-1.0.0',
        name: getStoreNameFromAccount(account),
        symbol: symbol.replace(/[^a-z0-9]+/gim, '').toLowerCase(),
        icon: options?.icon ?? MINTBASE_32x32_BASE64_DARK_LOGO,
        base_uri: null,
        reference: null,
        reference_hash: null,
      },
    }

    const attachedDeposit = DEPLOY_STORE_COST

    // @ts-ignore: method does not exist on Contract type
    await contract.create_store({
      meta: options?.meta,
      callbackUrl: options?.callbackUrl,
      args: storeData,
      gas,
      amount: attachedDeposit,
    })

    return true;
  }