import { CalleeBackCreate, CallerBCInitData, FACalleeCommunication } from "../../interfaces"
import * as Chance from "chance"
import { generateSecureHash } from "../../secure_hash"

class SimpleStream implements CalleeBackCreate {

  private _host :string
  private _port :string
  private _com :FACalleeCommunication
  private _magicToken = new Chance().guid()
  private _mySecureHash :string = generateSecureHash(this._magicToken, new Chance().guid())

  constructor (host :string = "localhost", port :string = "8080") {
    this._host = host
    this._port = port
  }

  public setCommunication(communication :FACalleeCommunication) :void {
    this._com = communication
    this._com.onMessage(this._mySecureHash, this._messageCbk)
  }

  private _messageCbk() {
    
  }

  public getBCInitDataForCaller() :CallerBCInitData {
    return {
      constructorName : "SimpleStream",
      constructorArgs : [ this._host, this._port ],
      initArgs : []
    }
  }
}
