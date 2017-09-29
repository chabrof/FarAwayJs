import * as jsSHA from "jssha";
export function generateSecureHash(magicToken, clientGUID) {
    let shaObj = new jsSHA.default("SHA-256", "TEXT");
    shaObj.update(magicToken + clientGUID);
    let secureHash = shaObj.getHash("HEX");
    return secureHash;
}
