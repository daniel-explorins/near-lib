

import {
  Contract,
  ConnectedWalletAccount
} from 'near-api-js';

import {
  ConstructNearWalletParams,
  MetadataField,
  MintbaseThing,
  NearNetwork,
  NearWalletDetails,
  Network,
} from './types'
import {
  STORE_CONTRACT_VIEW_METHODS,
  STORE_CONTRACT_CALL_METHODS,
  FACTORY_CONTRACT_NAME,
  MAX_GAS,
  ONE_YOCTO
} from './constants';
import { BehaviorSubject, shareReplay } from 'rxjs';
import { CannotConnectError } from './error/cannotConectError';
import { CannotDisconnectError } from './error/cannotDisconnectError';
import { CannotTransferTokenError } from './error/cannotTransferTokenError';
import { MintbaseWallet } from './mintbase/mintbase-wallet';
import { CannotGetContractError } from './error/CannotGetContractError';
import { CannotGetTokenError } from './error/CannotGetTokenError';
import { cannotFetchStoreError } from './error/cannotFetchStoreError';
import { cannotFetchMarketPlaceError } from './error/cannotFetchMarketPlaceError';
import { GetStoreByOwner, GetTokensOfStoreId } from './graphql_types';
import { NanostoreWallet } from './nanostore/nanostore-wallet';
import { Chain } from 'mintbase';
import { NANOSTORE_CONTRACT_NAME } from './nanostore/constants';
import { TEST_METADATA } from './constants/test.data';

/** 
 * Object that contains the methods and variables necessary to interact with the near wallet 
 * At the moment only the connection to the mintbase wallet is supported
 */
export class NearWallet {
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
            contractName: NANOSTORE_CONTRACT_NAME // Mintbase: FACTORY_CONTRACT_NAME
          });
        break;
      default:
        throw CannotConnectError.becauseUnsupportedNetwork();
    }

  }

  /**
   * @description initializes mintbase wallet custom object and sets graphql object
   * @description sets logged observable state
   * ------------------------------------------------------------------------------------
   */
  public async init(): Promise<void> {
    if(!this.mintbaseWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
    try {
      await this.mintbaseWallet.init(this.mintbaseWallet.walletConfig);
    } catch (error) {
        console.log('Init error: ', error);
    }

    if(!this.mintbaseWallet.activeWallet) throw CannotConnectError.becauseMintbaseNotConnected();
    
    if(this.mintbaseWallet.activeWallet.isSignedIn()) {
        this._isLogged$.next(true);
        
        const walletDetails = await this.getMintbaseAccountData();
        console.log('Details ... ', walletDetails)
    } else {
        this._isLogged$.next(false);
    }
    // await this.nanostoreWallet.connect();
    // const minters = await this.nanostoreWallet.getMinters();
    // console.log('los minters: ', minters);
    
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
      await this.mintbaseWallet.connect({ requestSignIn: true });
      this._isLogged$.next(true);
    } catch (error) {
      this._isLogged$.next(false);
      throw CannotConnectError.becauseMintbaseLoginFail();
    }
  }

  public async pruebas1() {

    await this.mintbaseWallet.grantMinter('eurega.testnet', NANOSTORE_CONTRACT_NAME);
  }

  public async pruebas2(file: File) {
    await this.printableNftMint(file)
  }

  /**
     * @description Mint an nft that could be 3d printed
     * ------------------------------------------------------------------------------------
     * @param {ConnectedWalletAccount} account
     */
  public async printableNftMint(file: File): Promise<void> {
    if(!this.mintbaseWallet || !this.mintbaseWallet.activeWallet) throw new Error('No wallet connection');
    if(!this.mintbaseWallet.minter) throw new Error('No minter defined');

    const metadata = TEST_METADATA;

    const { data: fileUploadResult, error: fileError } = await this.mintbaseWallet.minter.uploadField(MetadataField.Media, file);
    console.log('data', fileUploadResult);
    this.mintbaseWallet.minter.setField(MetadataField.Tags, metadata.tags);
    this.mintbaseWallet.minter.setField(MetadataField.Extra, metadata.extra);
    this.mintbaseWallet.minter.setMetadata(metadata, true);

    const { data: metadataId, error } = await this.mintbaseWallet.minter.getMetadataId();

    const meta = JSON.stringify({
      type: 'mint',
      args: {
        contractAddress: NANOSTORE_CONTRACT_NAME,
        amount: 1,
        thingId: `${metadataId}:${NANOSTORE_CONTRACT_NAME}`,
      },
    });

    try {
      const account = this.mintbaseWallet.activeWallet.account();
      const contract = new Contract(
          account, 
          NANOSTORE_CONTRACT_NAME,
          {
              viewMethods: STORE_CONTRACT_VIEW_METHODS,
              changeMethods: STORE_CONTRACT_CALL_METHODS
          }
      );
        
        

        /*
        await this.mintbaseWallet.mint(
          1,
          NANOSTORE_CONTRACT_NAME,
          undefined,
          undefined,
          'category...',
          {
            callbackUrl: "",
            meta,
            royaltyPercentage: 0,
            metadataId
          })
        */
        
        
          
        // @ts-ignore: method does not exist on Contract type
        await contract.nft_batch_mint({
          meta,
          callbackUrl: "",
          args: {
              owner_id: "nanostore.testnet",
              metadata: {
                reference: metadataId,
                ...metadata
             },
              "royalty_args": null,
              "num_to_mint":1
          },
          gas: MAX_GAS,
          amount: ONE_YOCTO,
        });
        
        
    } catch (error) {
        console.log('a error ocurred !', error);
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
   * @description return near contract that is being used
   * ------------------------------------------------------------------------------------
   * @throws {CannotGetContractError} if account or contractName not found
   */
  public getContract() {
    if(!this.account) throw CannotGetContractError.becauseUserNotFound();
    if(!this.contractName) throw CannotGetContractError.becauseContractNameNotFound();

    try {
      
      const contract = new Contract(
        this.account, 
        this.contractName,
        {
          viewMethods: STORE_CONTRACT_VIEW_METHODS,
          changeMethods: STORE_CONTRACT_CALL_METHODS
        }
      );

      return contract;
      
    } catch (error) {
      throw CannotGetContractError.becauseNearError();
    }
  }

  /**
   * TODO: check retryFetch logic
   * @description Returns the things that belong to the connected user
   * ------------------------------------------------------------------------------------
   * @returns {Promise<MintbaseThing[]>}
   */
  public async getTokenFromCurrentWallet( 
    intent = 0
  ): Promise<MintbaseThing[] | undefined>
  {
    if(!this.mintbaseWallet) throw CannotGetTokenError.becauseMintbaseNotConnected();

    return this.mintbaseWallet.getTokenFromCurrentWallet();
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

  /**
   * @description -
   * ------------------------------------------------------------------------------------
   * @param myStoreId 
   * @throws {cannotGetThingsError}
   */
  public async getMyStoreThings(myStoreId: string) {
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();
    return await this.mintbaseWallet?.getMyThings(myStoreId);
  }

  /**
   * TODO: Este método "list_minters" está en la documentación de mintbase, pero no existe ??
   * TODO: improve any return
   * @description Call the contract method list_minters
   * ------------------------------------------------------------------------------------
   */
  public async getMinters(): Promise<any>
  {
    if(!this.mintbaseWallet) throw CannotTransferTokenError.becauseMintbaseNotConnected();
    return await this.mintbaseWallet.getMinters();
  }


  /**
   * @description It is a bridge to use the native function of mintbase
   * ------------------------------------------------------------------------------------
   * @param limit number of results
   * @param offset number of records to skip
   * @throws {cannotFetchMarketPlaceError}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async fetchMintbaseMarketplace(
    offset?: number,
    limit?: number
  ) {
    if(!this.mintbaseWallet) throw cannotFetchMarketPlaceError.becauseMintbaseNotConnected();
    return await this.mintbaseWallet.fetchMarketplace(offset, limit);
  }

  /**
   * TODO: improve any return
   * @description It is a bridge to use the native function of mintbase
   * ------------------------------------------------------------------------------------
   * @param limit number of results
   * @param offset number of records to skip
   * @throws {cannotFetchStoreError} code: 0701. If internal mintbaseWallet was not found
   * @throws {cannotFetchStoreError} code: 0702. If internal mintbaseWallet api throws error
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async fetchMintbaseStores(
    offset?: number,
    limit?: number
  ): Promise<any>
  {
    if(!this.mintbaseWallet) throw cannotFetchStoreError.becauseMintbaseNotConnected();
    try {
      return await this.mintbaseWallet.fetchStores(offset, limit);
    } catch (error) {
        throw cannotFetchStoreError.becauseMintbaseError();
    }
  }

  /**
   * TODO: improve any return
   * @description Search and retrieve your near store in mintbase platform
   * ------------------------------------------------------------------------------------
   * @throws {cannotFetchStoreError} code: 0701. If some of the mandatory params was not found
   * @throws {cannotFetchStoreError} code: 0703. If graphql error
   */
  public async getMyMintbaseStores(): Promise<GetStoreByOwner>
  {
    if(!this.mintbaseWallet) throw cannotFetchStoreError.becauseMintbaseNotConnected();
    return await this.mintbaseWallet.getMyStores();
  }

  /**
   * @description
   * ------------------------------------------------------------------------------------
   * @param storeId 
   */
  public async getMintbaseTokensOfStoreId(
    storeId: string
  ): Promise<GetTokensOfStoreId>
  {
    if(!this.mintbaseWallet) throw cannotFetchStoreError.becauseMintbaseNotConnected();
    return await this.mintbaseWallet.getTokensOfStoreId(storeId);
  }

  /**
   * TODO: improve any return
   * @description It is a bridge to use the native function of mintbase
   * ------------------------------------------------------------------------------------
   * @param storeId 
   * @throws {cannotFetchStoreError} code: 0701. If internal mintbaseWallet object was not found
   * @throws {cannotFetchStoreError} code: 0702. If internal mintbase api throws error
   */
  public async fetchStoreById(
    storeId: string
  ): Promise<any>
  {
    if(!this.mintbaseWallet) throw cannotFetchStoreError.becauseMintbaseNotConnected();

    return await this.mintbaseWallet.fetchStoreById(storeId);
  }
}


/* Pruebas para subir imagenes

    const fetchResult = await fetch('/assets/nft-placeholder.png');
    const arrayBuffer = await fetchResult.arrayBuffer();
    var file = new File([arrayBuffer], "pruebas_img", {type: 'image/png'});
    console.log('El file  .... ', file);
    const fileResponse = await this.mintbaseWallet.minter.uploadField(MetadataField.Media, file);
    
    console.log('Imagen .... ', fileResponse);
    return;
    */