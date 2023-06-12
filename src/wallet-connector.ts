import { Network, NetworkId, WalletSelector, setupWalletSelector } from "@near-wallet-selector/core";
import { WalletSelectorModal, setupModal } from "@near-wallet-selector/modal-ui";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";

// Commented modules would need to be installed as dependencies
/* import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMathWallet } from "@near-wallet-selector/math-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNarwallets } from "@near-wallet-selector/narwallets";
import { setupWelldoneWallet } from "@near-wallet-selector/welldone-wallet";
import { setupNearSnap } from "@near-wallet-selector/near-snap"; */
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupWalletConnect } from "@near-wallet-selector/wallet-connect";
import { filter, from, shareReplay, switchMap, tap } from "rxjs";

/* import { setupNightlyConnect } from "@near-wallet-selector/nightly-connect";
import { setupNearFi } from "@near-wallet-selector/nearfi";
import { setupCoin98Wallet } from "@near-wallet-selector/coin98-wallet";
import { setupOptoWallet } from "@near-wallet-selector/opto-wallet";
import { setupFinerWallet } from "@near-wallet-selector/finer-wallet";
import { setupNeth } from "@near-wallet-selector/neth";
import { setupXDEFI } from "@near-wallet-selector/xdefi"; */


// dont forget to import the css
// @import '@explorins/near-lib/src/assets/styles/wallet-connector.css';


export class WalletConnector {
    private readonly modules = [
        setupNearWallet(),
        setupMyNearWallet(),
        setupLedger(),
    
        /* setupSender(),
        setupHereWallet(),
        setupMathWallet(),
        setupNightly(), */
        /* setupMeteorWallet(),
        setupNearSnap(),
        setupNarwallets(),
        setupWelldoneWallet(), */
        
        /* setupNearFi(),
        setupCoin98Wallet(),
        setupOptoWallet(),
        setupFinerWallet(),
        setupNeth(),
        setupXDEFI(), */
    

        // project would need to be registered with Wallet Connect
        /* setupWalletConnect({
          projectId: 'e4fee1e3796c37703d2b9705d396b164',
          metadata: {
            name: "nanoStore App",
            description: "nanoStore App Wallet Connect",
            url: "https://github.com/near/wallet-selector",
            icons: ["https://avatars.githubusercontent.com/u/37784886"],
          },
          chainId: "near:testnet",
            iconUrl: "https://www.nano-store.app/assets/icons/icon-512x512.png",
        }), */

        setupWalletConnect({
            projectId: this.walletConnectProjectId || '',
            metadata: {
              name: "nanoStore App",
              description: "nanoStore App Wallet Connect",
              url: "https://github.com/near/wallet-selector",
              icons: ["https://avatars.githubusercontent.com/u/37784886"],
            },
            chainId: `near:${this.networkName}`,
              iconUrl: "https://www.nano-store.app/assets/icons/icon-512x512.png",
          }),
        
        /* setupNightlyConnect({
          url: "wss://relay.nightly.app/app",
          appMetadata: {
            additionalInfo: "",
            application: "NEAR Wallet Selector",
            description: "Example dApp used by NEAR Wallet Selector",
            icon: "https://near.org/wp-content/uploads/2020/09/cropped-favicon-192x192.png",
          },
        }), */
      ]

    private walletModal?: WalletSelectorModal;
    private selector?: WalletSelector

    walletSelectorState$ = this.getWalletStateObservable().pipe(
        tap(async ()=> {
            const wallet = await this.selector?.wallet();
            console.log('wallet',wallet)
        }),
        shareReplay(1)
    );

    wallet$ = this.walletSelectorState$.pipe(
        filter((state) => this.selector !== undefined),
        switchMap((state) => from(this.selector!.wallet())),
        shareReplay(1)
    );


    constructor(
        private networkName: NetworkId | Network,
        private contractId: string,
        private walletConnectProjectId?: string
    ) {
        //  this.initWalletSelector(networkName)
    }

    private getWalletStateObservable() {
        return this.selector ? this.selector.store.observable : from(this.initWalletSelector(this.networkName)).pipe(switchMap((selector) => selector.store.observable));
    }

    private async initWalletSelector(networkName: NetworkId | Network) {
        this.selector = await setupWalletSelector({
            network: networkName,
            debug: true,
            modules: this.modules,
        });
        return this.selector;
    }

    private async initWalletModal(contractId: string) {
        if (!this.selector) {
            await this.initWalletSelector(this.networkName)
        }
        return setupModal(this.selector!, {
            contractId: contractId,
            });
    }

    public async showWalletModal() {
        if (!this.walletModal) {
            this.walletModal = await this.initWalletModal(this.contractId);
        }
        this.walletModal!.show();
        return this.walletModal;
    }

    public setActiveAccount(accountId: string) {
        this.selector?.setActiveAccount(accountId);
    }

    public async signOut(){
        const wallet = await this.selector?.wallet();
        await wallet?.signOut();
    }
}

