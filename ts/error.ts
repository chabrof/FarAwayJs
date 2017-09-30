import { FASending } from "./interfaces"
import { _console } from "./_debug"

export function generateError(srcSecureHash :string, communication :FASending, code :number, message :string, destSecureHash? :string, debugObj? :any) {
  console.error('Generate error :', message)
  if (debugObj !== undefined)
    console.error('DebugObj', debugObj)

  _console.assert(communication !== undefined && communication !== null, "communication must be a valid FACommunication instance")

  communication.send(
    srcSecureHash,
    destSecureHash,
    JSON.stringify({
      "type" :  "farError",
      "error" : {
        "code"     : code,
        "message"  : message
      }
    } ))
}
