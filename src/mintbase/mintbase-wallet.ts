import { Wallet } from "mintbase";
import { Chain, Network, WalletConfig } from "mintbase/lib/types";
import { Contract } from "near-api-js";
import { MAX_GAS, ONE_YOCTO, STORE_CONTRACT_CALL_METHODS, STORE_CONTRACT_VIEW_METHODS } from "src/constants";
import { CannotConnectError } from "src/error/cannotConectError";
import { CannotDisconnectError } from "src/error/cannotDisconnectError";
import { CannotTransferTokenError } from "src/error/cannotTransferTokenError";

/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class MintbaseWallet extends Wallet {

    /** Configuration object to login in mintbase */
    private mintbaseWalletConfig: WalletConfig;

    public constructor(
        private apiKey: string,
        public networkName: Network
    ) {
        super();

        let network;

        switch (networkName) {
            case Network.mainnet:
              network = Network.mainnet;
              break;
            case Network.testnet:
              network = Network.testnet;
              break;
            default:
              throw CannotConnectError.becauseUnsupportedNetwork();
          }

        this.mintbaseWalletConfig = {
            networkName: network,
            chain: Chain.near,
            apiKey: this.apiKey,
          };
    }


    /**
     * @description
     * @throws {CannotConnectError}
     */
    public async mintbaseLogin(): Promise<void>
    {
        let isConnected;

        try {
        
            const { data: walletData } = await this.init(
                this.mintbaseWalletConfig
            );
            isConnected  = walletData.isConnected;

        } catch (error) {
            throw CannotConnectError.becauseMintbaseLoginFail();
        }

        if (!isConnected) {
            throw CannotConnectError.becauseMintbaseLoginFail();
        }
    }


    /**
     * @description
     * @throws {CannotConnectError}
     */
    public async getAccountId(): Promise<string>
    {
        try {
            const { data: details } = await this.details();
            return details.accountId;
        } catch (error) {
            throw CannotConnectError.becauseMintbaseError();
        }
    }

    /**
     * @description
     * @throws {CannotDisconnectError}
     */
    public logout(): void
    {
        try {
            this.activeWallet?.signOut()
          } catch (error) {
            throw CannotDisconnectError.becauseMintbaseError();
          }
      
          this.activeNearConnection = undefined
          this.activeAccount = undefined;
    }

    /**
     * @throws {CannotTransferTokenError}
     */
    public transferToken(tokenId: string) {
        const account = this.activeWallet?.account()
        const accountId = this.activeWallet?.account().accountId;
        const contractName = this.activeNearConnection?.config.contractName;

        if (!account || !accountId) {
        throw CannotTransferTokenError.becauseAccountNotFound();
        }

        if (!contractName) {
        throw CannotTransferTokenError.becauseContractNotFound();
        }

        const contract = new Contract(account, contractName, {
            viewMethods:
              this.constants.STORE_CONTRACT_VIEW_METHODS ||
              STORE_CONTRACT_VIEW_METHODS,
            changeMethods:
              this.constants.STORE_CONTRACT_CALL_METHODS ||
              STORE_CONTRACT_CALL_METHODS,
            })
        try {
            // @ts-ignore: method does not exist on Contract type
            await contract.nft_transfer({
                args: { 
                    receiver_id: accountId, 
                    token_id: tokenId 
                },
                gas: MAX_GAS,
                amount: ONE_YOCTO,
            });
        } catch (error) {
            throw CannotTransferTokenError.becauseTransactionFails();
        }
    }
}