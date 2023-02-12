import { ConnectedWalletAccount, Contract, utils } from "near-api-js";
import { BehaviorSubject, shareReplay } from "rxjs";
import { DEPLOY_STORE_COST, FACTORY_CONTRACT_NAME, MAX_GAS, MINTBASE_32x32_BASE64_DARK_LOGO, NANOSTORE_FACTORY_CONTRACT_CALL_METHODS, NANOSTORE_FACTORY_CONTRACT_NAME, NANOSTORE_FACTORY_CONTRACT_VIEW_METHODS, ONE_YOCTO, TWENTY_FOUR } from "../constants";
import { CannotConnectError, CannotDisconnectError, CannotGetTokenError, cannotMakeOfferError, CannotTransferTokenError } from "../error";
import { MINTBASE_MARKETPLACE_TESTNET, MINTBASE_MARKET_CONTRACT_CALL_METHODS, MINTBASE_MARKET_CONTRACT_VIEW_METHODS } from "../mintbase/constants";
import { MintbaseWallet } from "../mintbase/mintbase-wallet";
import { Chain, NearNetwork, NearTransaction, NearWalletDetails, Network, OptionalMethodArgs } from "../types";
import { MetadataField, NANOSTORE_CONTRACT_CALL_METHODS, NANOSTORE_CONTRACT_NAME, NANOSTORE_CONTRACT_VIEW_METHODS } from "./constants";
import * as nearUtils from './../utils/near';
import { TEST_METADATA } from "./test.data";
import { CannotMint3DToken } from "../error/CannotMint3DToken";
import BN from "bn.js";
import { getStoreNameFromAccount } from "../utils/nanostore";
import { JsonToUint8Array } from "./../utils/near";
const elliptic = require("elliptic").ec;
/** 
 * @description Class that extends the mintbase wallet for use in specific applications
 * All logic attached to mintbase has been separated to isolate the effects of future updates
 */
export class Nanostore {
    /** Internal subject that stores login state */
  private _isLogged$ = new BehaviorSubject(false);

  /** External public observable to login state */
  public isLogged$ = this._isLogged$.asObservable().pipe(shareReplay());

  /** Name that give us access to contract */
  public contractName: string | undefined;

  /** Account key for connected user (you) */
  public account: ConnectedWalletAccount | undefined;

  /** mintbaseWallet is the object that contains all mintbase methods and parameters */
  private mintbaseWallet: MintbaseWallet;

  /**
   * @MF TODO: Move initialization from constructor to static public method ?
   * @description The constructor only sets three variables: apiKey, networkName and mintbaseWallet
   * ------------------------------------------------------------------------------------
   * @param {string} apiKey - mintbase apikey 
   * @param {Network} networkName - default value is 'testnet'
   * @throws {CannotConnectError} if network is unrecognized
   */
  public constructor(
    private apiKey: string,
    public networkName: NearNetwork = NearNetwork.testnet
  ) {
    // MintbaseWallet is required for use this library
    // First of all we set mintbaseWalletConfig
    switch (networkName) {
      case NearNetwork.mainnet:
          this.mintbaseWallet = new MintbaseWallet({
            apiKey, 
            networkName: Network.mainnet, 
            chain: Chain.near, 
            contractName: FACTORY_CONTRACT_NAME // Mintbase: FACTORY_CONTRACT_NAME
          });
          
        break;
      case NearNetwork.testnet:
          this.mintbaseWallet = new MintbaseWallet({
            apiKey, 
            networkName: Network.testnet, 
            chain: Chain.near, 
            contractName: NANOSTORE_FACTORY_CONTRACT_NAME // Mintbase: FACTORY_CONTRACT_NAME
          });
        break;
      default:
        throw CannotConnectError.becauseUnsupportedNetwork();
    }

  }

  public async buyToken() {

    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId
    const gas = MAX_GAS;
    const timeout = TWENTY_FOUR;

    if (!account || !accountId) throw cannotMakeOfferError.becauseUserNotFound();

    // Mitbase market connection
    const contract = new Contract(
      account,
      MINTBASE_MARKETPLACE_TESTNET,
      {
        viewMethods:
            MINTBASE_MARKET_CONTRACT_VIEW_METHODS,
        changeMethods:
            MINTBASE_MARKET_CONTRACT_CALL_METHODS,
      }
    )
    try {

      const amount = utils.format.parseNearAmount('16')
        // @ts-ignore: method does not exist on Contract type
        await contract.buy({
            args: {
              nft_contract_id: 'nanostore_store.dev-1675363616907-84002391197707', //  ["0:amber_v2.tenk.testnet"],
              token_id: '7'
            },
            gas,
            amount: amount,
        })
    } catch (error) {
        console.log('error: ', error)
        throw cannotMakeOfferError.becauseMintbaseError();
    }
  }

  public async deposit_and_set_price(
    tokenId: number,
	  price: number
  ) {

    const priceInNear = utils.format.parseNearAmount(price.toString());
	  if(!priceInNear) throw new Error('not price provided');

    const args = {};
    const args2 = {
      autotransfer: true,
      token_id: tokenId.toString(),
      account_id:'market-v2-beta.mintspace2.testnet',
      msg: JSON.stringify({
        price: priceInNear.toString(),
        autotransfer: true,
      })
    }
    
    const args_base64 = JsonToUint8Array(args);
    const args2_base64 = JsonToUint8Array(args2);

    const market_cost = 0.02;
    const listCost = nearUtils.calculateListCost(1);
    const deposit = utils.format.parseNearAmount(listCost.toString()) ?? '0';
    const market_deposit = utils.format.parseNearAmount(market_cost.toString()) ?? '0';

    const ec = new elliptic("secp256k1");
    // Generate a new key pair
    const keyPair = ec.genKeyPair();

  // Get the public key in hexadecimal format
  const publicKey = keyPair.getPublic().encode("hex");

    const transactions: NearTransaction[] = [
      {
        functionCalls: [
          {
            args: args_base64,
            deposit: new BN(market_deposit),
            gas: MAX_GAS,
            methodName: "deposit_storage"
          }
        ],
        signerId: "",
        receiverId: MINTBASE_MARKETPLACE_TESTNET,
        publicKey: publicKey,
        actions: [],
        nonce: 0,
        blockHash: args_base64,
        encode: () => args_base64
      },
      {
        functionCalls: [
          {
            args: args2_base64,
            deposit: new BN(deposit),
            gas: MAX_GAS,
            methodName: "nft_approve"
          }
        ],
        signerId: "",
        receiverId: NANOSTORE_CONTRACT_NAME,
        publicKey: publicKey,
        actions: [],
        nonce: 0,
        blockHash: args_base64,
        encode: () => args_base64
      }
    ];
    try {
      await this.mintbaseWallet.executeMultipleTransactions({transactions});
    } catch (error) {
      console.log(' ****************  error: ', error);
    }
  }

  /**
   * @description initializes mintbase wallet custom object and sets graphql object
   * @description sets logged observable state
   * ------------------------------------------------------------------------------------
   */
  public async init(): Promise<void> {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    let initResponse;
    try {
      initResponse = await this.mintbaseWallet.init(this.mintbaseWallet.walletConfig);
      console.log('Init response --------------------------- : ', initResponse);
    } catch (error) {
        console.log('Init error: ', error);
    }

    if(!this.mintbaseWallet.activeWallet) throw CannotConnectError.becauseMintbaseNotConnected();
   
    if(this.mintbaseWallet.activeWallet.isSignedIn()) {
        this._isLogged$.next(true);
        const walletDetails = await this.getMintbaseAccountData();
        console.log('Connection Details ... ', walletDetails)
    } else {
        this._isLogged$.next(false);
    }
  }

  /**
   * @description Usually this method must be called on login button action
   * @description Currently making a connection to the mintbase wallet
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} if connection to mintbase could not be made
   */
  public async connect(): Promise<void>
  {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
    if (this.mintbaseWallet.isConnected()) {
      this._isLogged$.next(true);
      console.warn('near-lib connect(): connecting an already connected wallet.')
      return;
    }
    
    try {
      // If the wallet is not connected, we go to the connection page
      await this.mintbaseWallet.connect({ contractAddress: NANOSTORE_CONTRACT_NAME,  requestSignIn: true });
      this._isLogged$.next(true);
    } catch (error) {
      this._isLogged$.next(false);
      throw CannotConnectError.becauseMintbaseLoginFail();
    }
  }

  /**
   * @description Creates a store. For future developments.
   * ------------------------------------------
   * @param storeId Store name
   * @param symbol Store symbol
   */
  public async deployStore(
    symbol: string,
    options?: OptionalMethodArgs & { attachedDeposit?: string; icon?: string }
  ): Promise<boolean> {
    const account = this.mintbaseWallet.activeWallet?.account()
    const accountId = this.mintbaseWallet.activeWallet?.account().accountId

	if (!account || !accountId) throw new Error('Undefined account');

    const gas = MAX_GAS;
	// console.log('saccount: ', account);

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
      //: new BN(options?.attachedDeposit)

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

  

    /**
     * @description Mint an nft that could be 3d printed
     * ------------------------------------------------------------------------------------
     * @param {ConnectedWalletAccount} account
     * @throws {CannotMint3DToken} code: 1013 - If contract call or creation throws eror
     */
    public async printableNftMint(file: File, numToMint: number): Promise<void> {
        
        if(!this.mintbaseWallet || !this.mintbaseWallet.activeWallet) throw new Error('No wallet connection');
        if(!this.mintbaseWallet.minter) throw new Error('No minter defined');

        const metadata = TEST_METADATA;
        const { data, error: fileError } = await this.mintbaseWallet.minter.uploadField(MetadataField.Media, file);
        // this.mintbaseWallet.minter.setField(MetadataField.Tags, ["tag prueba 1", "tag prueba 2", "3D print hola ?"]);
        // this.mintbaseWallet.minter.setField(MetadataField.Extra, [{trait_type: "material1 - prueba2", value: 5}, {trait_type: "material2 - prueba2", value: 11}, {trait_type: "material3 - prueba2", value: 10}]);
        this.mintbaseWallet.minter.setMetadata(metadata, false);

        const { data: metadataId, error } = await this.mintbaseWallet.minter.getMetadataId();

        const meta = JSON.stringify({
            type: 'mint',
            args: {
                contractAddress: NANOSTORE_CONTRACT_NAME,
                amount: numToMint,
                thingId: `${metadataId}:${NANOSTORE_CONTRACT_NAME}`,
            }
        });

        const account = this.mintbaseWallet.activeWallet.account();
        let contract;
        
        try {
            // NANOSTORE contract interaction
            contract = new Contract(
                account, 
                NANOSTORE_CONTRACT_NAME,
                {
                    viewMethods: NANOSTORE_CONTRACT_VIEW_METHODS,
                    changeMethods: NANOSTORE_CONTRACT_CALL_METHODS
                }
            );
        } catch (error) {
            throw CannotMint3DToken.becauseContractError();
        }

        try {
            // @ts-ignore: method does not exist on Contract type
            await contract.nft_batch_mint({
            meta,
            callbackUrl: "",
            args: {
                owner_id: account.accountId,
                metadata: {
                    reference: metadataId,
                    extra: 'Category'
                },
                // @TODO: Que hacemos con esto ?
                royalty_args: null,
                num_to_mint: numToMint
            },
            gas: MAX_GAS,
            amount: ONE_YOCTO,
            });
        } catch (error) {
            throw CannotMint3DToken.becauseContractError();
        }
    }

  /**
   * @description It is simply a bridge to the details of the wallet
   * ------------------------------------------------------------------------------------
   * @returns {{details: NearWalletDetails}} get details stored in mintbase connection object
   * @throws {CannotConnectError} If dont have mintbase wallet or mintbase lib method throws an exception
   */
  public async getMintbaseAccountData(): Promise<{details: NearWalletDetails, contractName: string, account: any}> {
    if(!this.mintbaseWallet || !this.mintbaseWallet.activeWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
    try {
      const { data: details } = await this.mintbaseWallet.details();
      const contractName = details.contractName;
      const account = this.mintbaseWallet.activeWallet.account();
    
      return {details, contractName, account};
      
    } catch (error) {
      throw CannotConnectError.becauseMintbaseError();
    }
  }

  /**
   * TODO: check retryFetch logic
   * TODO: type token returned
   * @description Returns all the tokens minted with nanostore contract
   * @param offset
   * @param limit
   * ------------------------------------------------------------------------------------
   * @throws {CannotGetTokenError}
   */
    public async getAllTokensFromNanostore( 
        offset: number, 
		    limit: number
    ): Promise<any>
    {
        if(!this.mintbaseWallet) throw CannotGetTokenError.becauseMintbaseNotConnected();

        return await this.mintbaseWallet.mintbaseGraphql?.getTokensFromContract(0,10, NANOSTORE_CONTRACT_NAME);
    }

  /**
   * @description Do mintbase signOut, clean local variables and update logged observable
   * ------------------------------------------------------------------------------------
   * @throws {CannotDisconnectError} if mintbase signout method fails
   */
  public disconnect(): void 
  {
    if(!this.mintbaseWallet) throw CannotDisconnectError.becauseMintbaseNotConnected();
    if(!this._isLogged$.value) throw CannotDisconnectError.becauseAlreadyDisconnected();
    
    this.mintbaseWallet.logout();
    this._isLogged$.next(false);
  }


  /**
   * @description Transfer one token inside mintbase wallet.
   * ------------------------------------------------------------------------------------
   * @description This method depends on STORE_CONTRACT_CALL_METHODS and STORE_CONTRACT_VIEW_METHODS ,  twice mintbase constants
   * @param {string} tokenId The token id to transfer.
   * @throws {CannotTransferTokenError}
   */
  public async transferToken(
    tokenId: string
  ): Promise<void> 
  {
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();
    await this.mintbaseWallet.transferToken(tokenId);
  }
  
}