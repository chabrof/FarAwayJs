import { CalleeBackCreate, CallerBCInitData, FACalleeCommunication } from "../../interfaces"
import * as Chance from "chance"
import { generateSecureHash } from "../../secure_hash"
import { _console } from "../../_debug"

export class SimpleStream implements CalleeBackCreate {

  private _hostForCaller :string
  private _portForCaller :string
  private _com :FACalleeCommunication
  private _magicToken = new Chance().guid()
  private _mySecureHash :string = generateSecureHash(this._magicToken, new Chance().guid())

  constructor (hostForCaller :string = "localhost", portForCaller :string = "8081") {
    this._hostForCaller = hostForCaller
    this._portForCaller = portForCaller
  }

  public setCommunication(communication :FACalleeCommunication) :void {
    this._com = communication
    this._com.onMessage(this._mySecureHash, this._messageCbk)
  }

  private _messageCbk() {
    _console.assert("This is a read only stream, there is no possible response by the client")
  }

  public sendData(data) {
    socket.send(JSON.stringify({ srcSecureHash, message }))
  }

  public getBCInitDataForCaller() :CallerBCInitData {
    return {
      constructorName : "SimpleStream",
      constructorArgs : [ this._hostForCaller, this._portForCaller ],
      initArgs : []
    }
  }
}
