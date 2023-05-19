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

  export const JsonToUint8Array = function(json: Object)
{
	var str = JSON.stringify(json, null, 0);
	var ret = new Uint8Array(str.length);
	for (var i = 0; i < str.length; i++) {
		ret[i] = str.charCodeAt(i);
	}
	return ret
};

export const calculateListCost = (amount: number): number => {
  const cost = 0.0144 * amount
  return cost
}