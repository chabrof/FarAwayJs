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
  private _treat :any = {}
  private _callerSecureHashes = {}

  constructor (hostForCaller :string = "localhost", portForCaller :string = "8081") {
    this._hostForCaller = hostForCaller
    this._portForCaller = portForCaller
    this._treat.farHandShake = ((callObj) => this._treatFarHandShake(callObj))
  }

  private _treatFarHandShake (callObj) {
    _console.log('SimpleStream : treat._farHandShake', callObj)
    _console.assert(this._com, 'communication must be set before calling this function')

   if (! callObj.callerGUID) {
      throw {
          "message"           : "callerGUID must be provided",
          "callerSecureHash"  : null
        }
    }

    // CallerSecureHash is just a GUID, we generate callerSecureHash with it
    let callerSecureHash = generateSecureHash(this._magicToken, callObj.callerGUID)
    // Register client
    _console.log(`--> Generate secure hash for GUID (${callObj.callerGUID})`)
    _console.log(`    : ${callerSecureHash}`);
    this._callerSecureHashes[callerSecureHash] = true

    this._com.registerCallerSecureHash(this._mySecureHash, callObj.callerGUID, callerSecureHash)
    // At this point, caller must provide its secureHash
    setTimeout(() => {
        this._com.send( this._mySecureHash,
                        callerSecureHash,
                        JSON.stringify({
                            "type" 		          : "farHandShakeReturn",
                            "callerSecureHash"  : callerSecureHash
                          }))
      }, 0)
  }

  public setCommunication(communication :FACalleeCommunication) :void {
    this._com = communication
    this._com.onMessage(this._mySecureHash, (data :string) => this._messageCbk(data))
  }

  private _messageCbk(data :string) {
    _console.log('Callee message handler...')
    let messageObj :any
    try {
      messageObj = JSON.parse(data)
    }
    catch (e) {
      _console.error(`JSON parse error, message is not in the good format : ${data}`)
      return
    }
    let secureHash
    try {
      secureHash = this._treat[messageObj.type](messageObj)
    }
    catch (e) {
      _console.error(`Error (not sent) on treat of type(${messageObj.type}) : `, e)
    }
    return secureHash
  }

  public sendData(data :any) {
    // We send data to all listening Callers
    this._com.send(this._mySecureHash, null, JSON.stringify(data))
  }

  public getBCInitDataForCaller() :CallerBCInitData {
    return {
      constructorName : "SimpleStream",
      constructorArgs : [ this._hostForCaller, this._portForCaller, this._mySecureHash ],
      initArgs : []
    }
  }
}
