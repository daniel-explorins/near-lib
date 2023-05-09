import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
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
import { NearNetwork } from "./../types";
// import { setupWalletConnect } from "@near-wallet-selector/wallet-connect";

/* import { setupNightlyConnect } from "@near-wallet-selector/nightly-connect";
import { setupNearFi } from "@near-wallet-selector/nearfi";
import { setupCoin98Wallet } from "@near-wallet-selector/coin98-wallet";
import { setupOptoWallet } from "@near-wallet-selector/opto-wallet";
import { setupFinerWallet } from "@near-wallet-selector/finer-wallet";
import { setupNeth } from "@near-wallet-selector/neth";
import { setupXDEFI } from "@near-wallet-selector/xdefi"; */

// TODO: check why not working


const modules = [
    setupNearWallet(),
    setupMyNearWallet(),
    /* setupSender(),
    setupHereWallet(),
    setupMathWallet(),
    setupNightly(), */
    /* setupMeteorWallet(),
    setupNearSnap(),
    setupNarwallets(),
    setupWelldoneWallet(), */
    setupLedger(),
    /* setupNearFi(),
    setupCoin98Wallet(),
    setupOptoWallet(),
    setupFinerWallet(),
    setupNeth(),
    setupXDEFI(), */

    // project would need to be registered with Wallet Connect
    /* setupWalletConnect({
      projectId: "c4f79cc...",
      metadata: {
        name: "NEAR Wallet Selector",
        description: "Example dApp used by NEAR Wallet Selector",
        url: "https://github.com/near/wallet-selector",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
    }), */
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

/* const selector = await setupWalletSelector({
    network: "testnet",
    modules: ,
  }); */
  
  export async function initWalletSelctor(network: NearNetwork, contractName: string) {
    const selector = await setupWalletSelector({
        network: network,
        modules: modules,
        });
    return setupModal(selector, {
            contractId: contractName
          });
  }
