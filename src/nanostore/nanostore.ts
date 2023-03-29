import { Account, connect as nearConnect, ConnectedWalletAccount, Contract, keyStores, Near, utils, WalletAccount, WalletConnection } from "near-api-js";
import { BehaviorSubject, shareReplay } from "rxjs";
import { DEPLOY_STORE_COST, FACTORY_CONTRACT_NAME, MAX_GAS, MINTBASE_32x32_BASE64_DARK_LOGO, NANOSTORE_FACTORY_CONTRACT_CALL_METHODS, NANOSTORE_FACTORY_CONTRACT_NAME, NANOSTORE_FACTORY_CONTRACT_VIEW_METHODS, ONE_YOCTO, STORE_CONTRACT_CALL_METHODS, STORE_CONTRACT_VIEW_METHODS, TWENTY_FOUR } from "../constants";
import { CannotConnectError, CannotDisconnectError, CannotGetTokenError, cannotMakeOfferError, CannotTransferTokenError } from "../error";
import { MINTBASE_MARKETPLACE_TESTNET, MINTBASE_MARKET_CONTRACT_CALL_METHODS, MINTBASE_MARKET_CONTRACT_VIEW_METHODS } from "../mintbase/constants";
import { Chain, NearNetwork, NearTransaction, NearWalletDetails, Network, OptionalMethodArgs } from "../types";
import { MetadataField, NANOSTORE_CONTRACT_CALL_METHODS, NANOSTORE_CONTRACT_NAME, NANOSTORE_CONTRACT_OWNER, NANOSTORE_CONTRACT_VIEW_METHODS, NANOSTORE_PRIVATE_KEY, TESTNET_CONFIG } from "./constants";
import * as nearUtils from './../utils/near';
import { TEST_METADATA } from "./test.data";
import { CannotMint3DToken } from "../error/CannotMint3DToken";
import BN from "bn.js";
import { getStoreNameFromAccount } from "../utils/nanostore";
import { JsonToUint8Array } from "./../utils/near";
import * as nearAPI from "near-api-js";

import { QUERIES, fetchGraphQl } from '@mintbase-js/data'
import { initializeExternalConstants } from "../utils/external-constants";
import { Minter } from "mintbase/lib/minter";
import { KeyStore } from "near-api-js/lib/key_stores";
import { MintbaseGraphql } from "../mintbase/mintbase-graphql";
import { API } from "mintbase";
import { Action, createTransaction, functionCall } from "near-api-js/lib/transaction";
import { base_decode } from "near-api-js/lib/utils/serialize";
import { PublicKey } from "near-api-js/lib/utils";

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

  private activeWallet?: WalletConnection;
  private activeNearConnection?: Near;
  private constants?: any;
  private keyStore?: KeyStore;
  private minter?: Minter;
  private activeAccount?: Account;
  private mintbaseGraphql: any;
  private api: any;

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
          
        break;
      case NearNetwork.testnet:
          
        break;
      default:
        throw CannotConnectError.becauseUnsupportedNetwork();
    }

  }

  public isConnected(): boolean {
    return this.activeWallet?.isSignedIn() ?? false
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

    this.api = new API({
      networkName: Network.testnet,
      chain: Chain.near,
      constants: this.constants,
    })

    // Use new lib
    this.minter = new Minter({
      apiKey: this.apiKey,
      constants: this.constants,
    })

    this.mintbaseGraphql = new MintbaseGraphql(this.api.apiBaseUrl);

    const keyStore = new keyStores.BrowserLocalStorageKeyStore();
    this.keyStore = keyStore;
    const _connectionObject = {
      deps: { keyStore },
      ...TESTNET_CONFIG
    }

    // If the wallet is not connected, we go to the connection page
    
    const near = await nearConnect(_connectionObject)
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

  
  public async myFetchMethod() {
    
  }
  

  public async buyToken() {

    const account = this.activeWallet?.account()
    const accountId = this.activeWallet?.account().accountId
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

  /**
   * 
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


  public async payPrintedToken(token_id: string) {
      const { keyStores, KeyPair, connect: nearConnect, WalletConnection  } = nearAPI;
      const myKeyStore = new keyStores.InMemoryKeyStore();
      const PRIVATE_KEY = NANOSTORE_PRIVATE_KEY;
      // creates a public / private key pair using the provided private key
      const keyPair = KeyPair.fromString(PRIVATE_KEY);
      // adds the keyPair you created to keyStore
      await myKeyStore.setKey("testnet", NANOSTORE_CONTRACT_OWNER, keyPair);

      const connectionConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
        contractName: NANOSTORE_CONTRACT_NAME,
        networkId: "testnet",
        deps: {keyStore: myKeyStore}, // first create a key store 
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
      };
      const nearConnection = await nearConnect(connectionConfig)

      const account = await nearConnection.account(NANOSTORE_CONTRACT_OWNER);
      const balance = await account.getAccountBalance();

      console.log(' ==== account: ', account);
      console.log(' ==== balance: ', balance);

      const contract = new Contract(
        account,
        NANOSTORE_CONTRACT_NAME,
        {
            viewMethods: NANOSTORE_CONTRACT_VIEW_METHODS,
            changeMethods: NANOSTORE_CONTRACT_CALL_METHODS
        }
      );

      try {
        // @ts-ignore: method does not exist on Contract type
        const printing  = await contract.nft_batch_print({
          meta: null,
          callbackUrl: '',
          args: {
            owner_id: 'nanostore.testnet', // @TODO este valor provendrá de base de datos
            token_id,                       // @TODO este valor provendrá de base de datos
            size: 1,
            printing_fee: 1,               // @TODO este valor provendrá de base de datos
            print_store: 'printernanostore.testnet' // @TODO este valor provendrá de base de datos

          },
          gas: MAX_GAS,
          amount: ONE_YOCTO,
        });

        console.log('printing ..........', printing )
      } catch (error) {
         throw error;
      }
  }

  /**
   * @description Usually this method must be called on login button action
   * @description Currently making a connection to the mintbase wallet
   * ------------------------------------------------------------------------------------
   * @throws {CannotConnectError} if connection to mintbase could not be made
   */
  public async connectNanostore(): Promise<void>
  {
    try {
      const { keyStores, KeyPair, connect: nearConnect, WalletConnection  } = nearAPI;
      const myKeyStore = new keyStores.InMemoryKeyStore();
      const PRIVATE_KEY = NANOSTORE_PRIVATE_KEY;
      // creates a public / private key pair using the provided private key
      const keyPair = KeyPair.fromString(PRIVATE_KEY);
      // adds the keyPair you created to keyStore
      await myKeyStore.setKey("testnet", NANOSTORE_CONTRACT_OWNER, keyPair);

      const connectionConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
        contractName: NANOSTORE_CONTRACT_NAME,
        networkId: "testnet",
        deps: {keyStore: myKeyStore}, // first create a key store 
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
      };
      const nearConnection = await nearConnect(connectionConfig)
      // const nearConnection = await nearConnect(connectionConfig);
      const activeWallet = new WalletConnection(nearConnection, 'Nanostore.js');
      const accountId = activeWallet.getAccountId();
      const activeAccount = await activeWallet.account()

      // console.log(' ==== activeAccount: ', activeAccount);
      // console.log(' ==== activeWallet: ', activeWallet);

      const account = await nearConnection.account(NANOSTORE_CONTRACT_OWNER);
      const balance = await account.getAccountBalance();

      console.log(' ==== account: ', account);
      console.log(' ==== balance: ', balance);

      const contract = new Contract(
        account,
        NANOSTORE_CONTRACT_NAME,
        {
            viewMethods: NANOSTORE_CONTRACT_VIEW_METHODS,
            changeMethods: NANOSTORE_CONTRACT_CALL_METHODS
        }
      );
      
      try {
        // @ts-ignore: method does not exist on Contract type
        const granting  = await contract.grant_printer({
          meta: null,
          callbackUrl: '',
          args: {"account_id": 'nanostore3.testnet'},
          gas: MAX_GAS,
          amount: ONE_YOCTO,
        });

        console.log('grant_printer ..........', granting )
      } catch (error) {
         throw error;
      }
      

      try {
        // @ts-ignore: method does not exist on Contract type
        const printers  = await contract.list_printers();

        console.log('printers ..........', printers )
      } catch (error) {
        
      }

      try {
        // @ts-ignore: method does not exist on Contract type
        const response = await contract.check_is_minter({
          "account_id": 'nanostore2.testnet'
        });

        console.log('response', response)
    } catch (error) {
      console.log(' ==== ERROR ==== ', error)
        throw CannotMint3DToken.becauseContractError();
    }



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
     * @description Mint an nft that could be 3d printed
     * ------------------------------------------------------------------------------------
     * @param {ConnectedWalletAccount} account
     * @throws {CannotMint3DToken} code: 1013 - If contract call or creation throws eror
     */
    public async printableNftMint(file: File, numToMint: number): Promise<void> {
        
        if(!this.minter || !this.activeWallet) throw new Error('No minter defined');

        const metadata = TEST_METADATA;
        const { data, error: fileError } = await this.minter.uploadField(MetadataField.Media, file);
        // this.mintbaseWallet.minter.setField(MetadataField.Tags, ["tag prueba 1", "tag prueba 2", "3D print hola ?"]);
        // this.mintbaseWallet.minter.setField(MetadataField.Extra, [{trait_type: "material1 - prueba2", value: 5}, {trait_type: "material2 - prueba2", value: 11}, {trait_type: "material3 - prueba2", value: 10}]);
        this.minter.setMetadata(metadata, false);

        const { data: metadataId, error } = await this.minter.getMetadataId();

        const meta = JSON.stringify({
            type: 'mint',
            args: {
                contractAddress: NANOSTORE_CONTRACT_NAME,
                amount: numToMint,
                thingId: `${metadataId}:${NANOSTORE_CONTRACT_NAME}`,
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
            await contract.nft_batch_mint({
            meta,
            callbackUrl: "",
            args: {
                owner_id: account.accountId,
                metadata: {
                    reference: metadataId,
                    extra: 'Nanostore'
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
      console.log('Entro')
      const { data, error } = await fetchGraphQl({
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

      console.log('data ********** : ', data)

      return await this.mintbaseGraphql?.getTokensFromContract(0,10, NANOSTORE_CONTRACT_NAME);
    }

  /**
   * @description Do mintbase signOut, clean local variables and update logged observable
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

  /**
     * @description
     * -----------------------------------------------
     * @throws {CannotTransferTokenError}
     */
  public async transferToken(
    tokenId: string
  ): Promise<any>
  {
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
                  receiver_id: 'nanostore.testnet', 
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