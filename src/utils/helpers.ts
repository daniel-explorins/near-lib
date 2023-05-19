import BN from "bn.js";
import { utils } from "near-api-js";

// convert number to BN
export function toBN(num: number | string): BN {
    return new BN(num.toString());
  }

// convert yoctoNEAR to NEAR
export function formatNearAmount(amount: string): string {
    return utils.format.formatNearAmount(amount);
  }