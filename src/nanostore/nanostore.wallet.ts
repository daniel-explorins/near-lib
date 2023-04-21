import { Account, connect as nearConnect, ConnectedWalletAccount, Contract, keyStores, Near, utils, WalletAccount, WalletConnection } from "near-api-js";
import { BehaviorSubject, shareReplay } from "rxjs";
import { DEPLOY_STORE_COST, MAX_GAS, MINTBASE_32x32_BASE64_DARK_LOGO, NANOSTORE_FACTORY_CONTRACT_NAME, ONE_YOCTO } from "../constants";
import { CannotConnectError, CannotDisconnectError, cannotMakeOfferError } from "../error";
import { MINTBASE_MARKETPLACE_TESTNET, MINTBASE_MARKET_CONTRACT_CALL_METHODS, MINTBASE_MARKET_CONTRACT_VIEW_METHODS } from "../mintbase/constants";
import { NearNetwork, NearTransaction, Network, OptionalMethodArgs } from "../types";
import { NANOSTORE_CONTRACT_CALL_METHODS, NANOSTORE_CONTRACT_NAME, NANOSTORE_CONTRACT_VIEW_METHODS, NANOSTORE_FACTORY_CONTRACT_CALL_METHODS, NANOSTORE_FACTORY_CONTRACT_VIEW_METHODS, NANOSTORE_PRIVATE_KEY, NANOSTORE_TESTNET_CONFIG } from "./constants";
import * as nearUtils from '../utils/near';
import { CannotMint3DToken } from "../error/CannotMint3DToken";
import BN from "bn.js";
import { getStoreNameFromAccount } from "../utils/nanostore";
import { JsonToUint8Array } from "../utils/near";
import { initializeExternalConstants } from "../utils/external-constants";
import { KeyStore } from "near-api-js/lib/key_stores";
import { uploadReference } from '@mintbase-js/storage';
import { Action, createTransaction, functionCall } from "near-api-js/lib/transaction";
import { base_decode } from "near-api-js/lib/utils/serialize";
import { PublicKey } from "near-api-js/lib/utils"; 
import { NanostoreGraphql } from "./graphql";
import { NanostoreBackend } from "./nanostore.backend";
import { ReferenceObject } from "./interfaces"; 

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

  // Internal used variables
  private activeWallet?: WalletConnection;
  private activeNearConnection?: Near;
  private constants?: any;
  private keyStore?: KeyStore;

  public nanostoreBackend;

  public activeAccount?: Account;

  // Public acces to graphQl queries
  public mintbaseGraphql: any;
  public nanostoreGraphql: NanostoreGraphql;

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

    this.nanostoreBackend = new NanostoreBackend();
    this.nanostoreGraphql = new NanostoreGraphql();
    // MintbaseWallet is required for use this library
    // First of all we set mintbaseWalletConfig
    switch (networkName) {
      case NearNetwork.mainnet:
          
        break;
      case NearNetwork.testnet:
          
        break;
      default:
        throw CannotConnectError.becauseUnsupportedNetwork();
    }

  }

  /**
   * @description
   * @returns 
   */
  public isConnected(): boolean {

    if(!this.activeWallet) return false;
    return this.activeWallet.isSignedIn() ?? false

  }

  /**
   * @description Usually this method must be called on login button action
   * @description Currently making a connection to the mintbase wallet
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} if connection to mintbase could not be made
   */
  public async connect(): Promise<void>
  {    
    if (this.isConnected()) {
      this._isLogged$.next(true);
      console.warn('near-lib connect(): connecting an already connected wallet.')
      return;
    }

    if(!this.activeWallet) return;
    
    try {
      // https://docs.near.org/tools/near-api-js/wallet
      this.activeWallet.requestSignIn({
        contractId: NANOSTORE_CONTRACT_NAME,
        successUrl: '',
        failureUrl: '',
      });

      this._isLogged$.next(true);
    } catch (error) {
      this._isLogged$.next(false);
      throw CannotConnectError.becauseMintbaseLoginFail();
    }
  }

  /**
   * @description initializes mintbase wallet custom object and sets graphql object
   * @description sets logged observable state
   * ------------------------------------------------------------------------------------
   */
  public async init(): Promise<void> {
    this.constants = await initializeExternalConstants({
      apiKey: this.apiKey,
      networkName: this.networkName,
    })

    const keyStore = new keyStores.BrowserLocalStorageKeyStore();
    this.keyStore = keyStore;
    const _connectionObject = {
      deps: { keyStore },
      ...NANOSTORE_TESTNET_CONFIG
    }

    // If the wallet is not connected, we go to the connection page
    
    const near = await nearConnect(_connectionObject);

    this.activeNearConnection = near;
    this.activeWallet = new WalletAccount(near, 'Nanostore');
    let initResponse;

    try {
      console.log('Init response --------------------------- : ', initResponse);
    } catch (error) {
        console.log('Init error: ', error);
    }
   
    if(this.activeWallet.isSignedIn()) {
        this._isLogged$.next(true);
        const accountId = this.activeWallet.getAccountId();
        this.activeAccount = await this.activeNearConnection.account(accountId);
        
        const walletDetails = await this.details();
        console.log('Connection Details ... ', walletDetails)
    } else {
        this._isLogged$.next(false);
    }
  }
  
  /**
   * @description
   * ------------------------------------------------------------------------------------
   */
  public async buyToken() {

    const account = this.activeWallet?.account()
    const accountId = this.activeWallet?.account().accountId
    const gas = MAX_GAS;

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

      const amount = utils.format.parseNearAmount('14')
        // @ts-ignore: method does not exist on Contract type
        await contract.buy({
            args: {
              nft_contract_id: NANOSTORE_CONTRACT_NAME, //  'nanostore_store.dev-1675363616907-84002391197707',
              token_id: '7'
            },
            gas,
            amount: amount, // attached deposit in yoctoNEAR
        })
    } catch (error) {
        console.log('error: ', error)
        throw cannotMakeOfferError.becauseMintbaseError();
    }
  }

  /**
   * @TODO Revisar a fondo
   * ------------------------------------------------------------------------------------
   * @param tokenId 
   * @param price 
   */
  public async deposit_and_set_price(
    tokenId: number,
	  price: number
  ) {
    const priceInNear = utils.format.parseNearAmount(price.toString());
    console.log('priceInNear: ', priceInNear);
	  if(!priceInNear) throw new Error('not price provided');
    
    const args = {};
    const args2 = {
      autotransfer: true,
      token_id: tokenId.toString(),
      account_id:MINTBASE_MARKETPLACE_TESTNET,
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
    const publicKey = this.activeNearConnection?.config.keyPair.getPublic().encode("hex");

    // const ec = new elliptic("secp256k1");
    // Generate a new key pair
    // const keyPair = ec.genKeyPair();

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
      await this.executeMultipleTransactions({transactions});
    } catch (error) {
      console.log(' ****************  error: ', error);
    }
  }

  // @TODO move to another object
  public async executeMultipleTransactions({
    transactions,
    options,
  }: {
    transactions: NearTransaction[]
    options?: OptionalMethodArgs
  }): Promise<void> {
    const nearTransactions = await Promise.all(
      transactions.map(async (tx, i) => {
        return await this.createTransaction({
          receiverId: tx.receiverId,
          actions: tx.functionCalls.map((fc) => {
            return functionCall(fc.methodName, fc.args, fc.gas, fc.deposit)
          }),
          nonceOffset: i + 1,
        })
      })
    )

    this.activeWallet?.requestSignTransactions({
      transactions: nearTransactions,
      callbackUrl: options?.callbackUrl,
      meta: options?.meta,
    })
  }

  // @TODO move to another object
  public async createTransaction({
    receiverId,
    actions,
    nonceOffset,
  }: {
    receiverId: any
    actions: Action[]
    nonceOffset: number
  }) {
    if (!this.activeWallet || !this.activeNearConnection) {
      throw new Error(`No active wallet or NEAR connection.`)
    }

    const localKey =
      await this.activeNearConnection?.connection.signer.getPublicKey(
        this.activeWallet?.account().accountId,
        this.activeNearConnection.connection.networkId
      )

    const accessKey = await this.activeWallet
      ?.account()
      .accessKeyForTransaction(receiverId, actions, localKey)

    if (!accessKey) {
      throw new Error(
        `Cannot find matching key for transaction sent to ${receiverId}`
      )
    }

    const block = await this.activeNearConnection?.connection.provider.block({
      finality: 'final',
    })

    if (!block) {
      throw new Error(`Cannot find block for transaction sent to ${receiverId}`)
    }

    const blockHash = base_decode(block?.header?.hash)

    const publicKey = PublicKey.from(accessKey.public_key)
    const nonce = accessKey.access_key.nonce + nonceOffset

    return createTransaction(
      this.activeWallet?.account().accountId,
      publicKey,
      receiverId,
      nonce,
      actions,
      blockHash
    )
  }

  public async callToPrint(
    tokenId: string,
    reference: string,
    fee: string
  ) {
    try {
      await this.nanostoreBackend.print(tokenId, reference);
    } catch (error) {
      console.log('ha fallado el print: ', error);
    }
    
  }

  /**
   * @description call nft_deposit_print on contract
   * --------------------------------------------------------------
   * @param token_id 
   * @param printing_fee 
   */
  public async depositToPrint(
    token_id: number, 
    printing_fee: number
  ) {
    const account = this.activeWallet?.account()
    const accountId = this.activeWallet?.account().accountId

	if (!account || !accountId) throw new Error('Undefined account');
	// console.log('saccount: ', account);

    const contract = new Contract(
      account,
      NANOSTORE_CONTRACT_NAME,
      {
          viewMethods: NANOSTORE_CONTRACT_VIEW_METHODS,
          changeMethods: NANOSTORE_CONTRACT_CALL_METHODS
      }
    )

    const amount = utils.format.parseNearAmount(printing_fee.toString())
    
    // TODO este metodo deberá llamarse despues del pago por wallet
    await this.nanostoreBackend.registerDepositToPrint(
      token_id.toString(),
      printing_fee.toString(),
      accountId
    )
    try {
      // @ts-ignore: method does not exist on Contract type
      await contract.nft_deposit_print({
        meta: null,
        callbackUrl: "",
            args: {
                token_id,
                printing_fee: 1,
                print_store: 'printernanostore.testnet'
            },
            gas: MAX_GAS,
            amount: 1,
      });
    } catch (error) {
      console.log(' ERROR in deposit print *** : ', error);
    } 
  }

  /**
   * @description Creates a store. For future developments.
   * ------------------------------------------------------------------------------------
   * @param storeId Store name
   * @param symbol Store symbol
   */
  public async deployStore(
    symbol: string,
    options?: OptionalMethodArgs & { attachedDeposit?: string; icon?: string }
  ): Promise<boolean> {
    const account = this.activeWallet?.account()
    const accountId = this.activeWallet?.account().accountId

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
   * @description
   * ---------------------------------------------------
   * @param imageFile 
   * @param stlFile 
   * @param numToMint 
   */
  public async mint(
    imageFile: File,
    stlFile: File,
    numToMint: number,
    fileName: string
  ) {

    if(!this.activeWallet) throw new Error('No wallet');
    if(!this.isConnected()) throw new Error('Not logged'); 

    let responseUpload;

    const referenceObject: ReferenceObject = {
      title: 'proves 1 backend',
      description: 'proves 2 backend',
      //for the media to be uploaded to arweave it must be contained in one of these 3 fields
      media: imageFile,
      category: 'proves 3 backend',
      tags: [{tag1 : "tag prueba 1 backend"}],
      // Esto se guardará en el backend
      extra: [{trait_type: "material1 - prueba2", value: 5}, {trait_type: "material2 - prueba2", value: 11}, {trait_type: "material3 - prueba2", value: 10}]
    }

    try {
      responseUpload = await uploadReference(referenceObject);
    } catch (error) {
      throw new Error('Mint storage error');
    }

    try {
      const reference = responseUpload.id;
      const accountId = this.activeWallet.account().accountId
      await this.nanostoreBackend.mint(stlFile, numToMint, accountId, reference, fileName);
    } catch (error) {
      throw new Error('Mint Backend error');
    }
  }

    /**
     * @description Mint an nft that could be 3d printed
     * Legacy method
     * ------------------------------------------------------------------------------------
     * @param {ConnectedWalletAccount} account
     * @throws {CannotMint3DToken} code: 1013 - If contract call or creation throws eror
     */
    public async mintByLoggedUser(
      file: File, 
      printerFile: File,
      numToMint: number
    ): Promise<void> {

      if(!this.activeWallet) throw new Error('No activeWallet defined');
      
      const referenceObject: ReferenceObject = {
        title: 'proves 1',
        description: 'proves 2',
        //for the media to be uploaded to arweave it must be contained in one of these 3 fields
        media: file,
        category: 'proves 3',
        tags: [{tag1 : "tag prueba 1"}],
        // Esto se guardará en el backend
        extra: [{trait_type: "material1 - prueba2", value: 5}, {trait_type: "material2 - prueba2", value: 11}, {trait_type: "material3 - prueba2", value: 10}]
      }
      
      const response = await uploadReference(referenceObject);

      const meta = JSON.stringify({
          type: 'mint',
          args: {
              contractAddress: NANOSTORE_CONTRACT_NAME,
              amount: numToMint
          }
      });

        // Ejecutamos el contrato con la cuenta logeada (app user)
        const account = this.activeWallet.account();
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
            const mintResponse = await contract.nft_batch_mint({
            meta,
            callbackUrl: "",
            args: {
                owner_id: account.accountId,
                metadata: {
                    reference: response.id,
                    extra: 'Nanostore testnet'
                },
                // @TODO: Que hacemos con esto ?
                royalty_args: null,
                num_to_mint: numToMint
            },
            gas: MAX_GAS,
            amount: ONE_YOCTO,
            });

            
            this.nanostoreBackend.payPrintedToken(file, 'loco', 'aww');

        } catch (error) {
            throw CannotMint3DToken.becauseContractError();
        }
    }

  public async details(): Promise<any>
  {
    const account = this.activeWallet?.account()
    const accountId = account?.accountId
    // @TODO throw error
    if (!accountId) return 
    const keyPair = await this.keyStore?.getKey(this.networkName, accountId)
    // @TODO throw error
    if (!keyPair) return;

    const publicKey = keyPair.getPublicKey().toString()
    const balance = await account.getAccountBalance()

    // @TODO throw error
    if (!balance) return 

    // @TODO ver que es esto
    // const { data: accessKey } = await this.viewAccessKey(accountId, publicKey)

    /*
    const allowance = utils?.format?.formatNearAmount(
      accessKey?.permission?.FunctionCall?.allowance ?? DEFAULT_ALLOWANCE
    )
    */

    const contractName = this.activeNearConnection?.config.contractName

    const data = {
      accountId: accountId,
      balance: utils.format.formatNearAmount(balance?.total, 2),
      // allowance: allowance,
      contractName: contractName,
    }
    return data;
  }

  /**
   * @description
   * ------------------------------------------------------------------------------------
   * @returns 
   */
  public async getMyTokens() {

    const account = this.activeWallet?.account();
    if(!account) throw new Error('No account defined');
    const accountId = account.accountId;

    return await this.nanostoreGraphql.getTokensFromOwner(accountId);

  }

  /**
   * TODO: check retryFetch logic
   * TODO: type token returned
   * @description Returns all the tokens minted with nanostore contract
   * ------------------------------------------------------------------------------------
   * @param offset
   * @param limit
   * @throws {CannotGetTokenError}
   */
    public async getAllTokensFromNanostore( 
        offset: number = 0, 
		    limit: number = 10
    ): Promise<any>
    {
      if(!this.nanostoreGraphql) throw  new Error('Graphql is not defined')
      /* New mintbase lib example

      const {data , error} = await fetchGraphQl({
        query: QUERIES.storeNftsQuery,
        variables: {
          condition: {
            nft_contract_id: { _in: NANOSTORE_CONTRACT_NAME }
          },
          limit: 12,
          offset: 0,
        },
        network: 'testnet'
      });
      */
      try {
        return await this.nanostoreGraphql.getAllTokens(offset,limit);
      } catch ($e) {
        throw new Error('Graphql error.');
      }
      
    }

    /**
     * @description
     * ------------------------------------------------------------------------------------
     */
    public getGraphQlObject() {
      if(!this.nanostoreGraphql) throw  new Error('Graphql is not defined')
      return this.nanostoreGraphql;
    }

  /**
   * @description Do signOut, clean local variables and update logged observable
   * ------------------------------------------------------------------------------------
   * @throws {CannotDisconnectError} if mintbase signout method fails
   */
  public disconnect(): void 
  {
    if(!this._isLogged$.value) throw CannotDisconnectError.becauseAlreadyDisconnected();
    
    this.activeWallet?.signOut()
    this.activeNearConnection = undefined
    this.activeAccount = undefined
    this._isLogged$.next(false);
  }
}