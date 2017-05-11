import * as jsSHA from "jssha"


export function generateSecureHash(magicToken :string, clientGUID :string) :string {
  let shaObj = new jsSHA("SHA-256", "TEXT")
  shaObj.update(magicToken + clientGUID)
  let secureHash = shaObj.getHash("HEX")

  return secureHash
}
