import BN from "bn.js";

// convert number to BN
export function toBN(num: number | string): BN {
    return new BN(num.toString());
  }