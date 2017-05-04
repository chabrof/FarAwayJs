import { FACommunication } from "./interfaces"
import { _console } from "./_debug"

export function generateError(communication :FACommunication, code :number, message :string) {
  console.error('Generate error :', message)
  _console.assert(communication !== undefined && communication !== null, "communication must be a valid FACommunication instance")

  communication.send(JSON.stringify(
    {
      "type" :  "farError",
      "error" : {
        "code"     : code,
        "message"  : message
      }
    }  ))
}
