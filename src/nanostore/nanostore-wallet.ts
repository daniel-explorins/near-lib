import { Chain, Network, OptionalMethodArgs, WalletConfig } from "mintbase/lib/types";
import { Contract } from "near-api-js";
import { 
  FACTORY_CONTRACT_NAME,
  MARKET_CONTRACT_CALL_METHODS,
  MARKET_CONTRACT_VIEW_METHODS,
  MAX_GAS,
  ONE_YOCTO,
  STORE_CONTRACT_CALL_METHODS,

  STORE_CONTRACT_VIEW_METHODS,
  TWENTY_FOUR } from "./../constants";
import { CannotConnectError } from "./../error/cannotConectError";
import { CannotDisconnectError } from "./../error/cannotDisconnectError";
import { cannotFetchMarketPlaceError } from "./../error/cannotFetchMarketPlaceError";
import { cannotFetchStoreError } from "./../error/cannotFetchStoreError";
import { cannotMakeOfferError } from "./../error/cannotMakeOfferError";
import { CannotTransferTokenError } from "./../error/cannotTransferTokenError";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class NanostoreWallet {

    private nanosToreWalletConfig: any;

    public constructor(
        public networkName: Network
    ) {
       
    }

 
}