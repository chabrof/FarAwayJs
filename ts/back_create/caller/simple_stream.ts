import { _console } from "../../_debug"
import { CallerBackCreate } from "../../interfaces"
import * as Chance from "chance"

export class SimpleStream implements CallerBackCreate {
  private _ws :WebSocket
  private _host :string
  private _port :string
  private _listeners :any[]
  private _listenersByType :any
  private _treat :any  = {}
  private _mySecureHash :string
  private _handShakeOkPromise :() => void
  private _myCallerGUID :string = new Chance().guid()
  private _calleeSecureHash :string

  constructor (host :string = "localhost", port :string = "8080", calleeSecureHash :string) {
    _console.assert(host && host.length, 'host must be a non null string')
    _console.assert(port && port.length, 'port must be a non null string')
    _console.assert(calleeSecureHash && calleeSecureHash.length, 'calleeSecureHash must be a non null string')

    this._host = host
    this._port = port
    this._listeners = []
    this._listenersByType = {}
    this._calleeSecureHash = calleeSecureHash
    this._treat.farHandShakeReturn = (data) => this._treatFarHandShakeReturn(data);
  }

  public init() :Promise<any> {
    _console.assert(this._ws === undefined, "You have already init the WebSocket listening")

    let wsServer = `ws://${this._host}:${this._port}`
    this._ws = new WebSocket(wsServer)
    let declareWsReady
    let openingPromise = new Promise<void>((ok, ko) => declareWsReady = ok)

    this._ws.addEventListener('open', function() { declareWsReady() })
    this._ws.addEventListener('message', (event) => this._messageHandler(event), false)

    let finalPromise = new Promise<any>(
      (ok, ko) => {
        this._handShakeOkPromise = ok
      } )

    openingPromise.then(() => this._farHandShake())

    return finalPromise // this promise will be completed when farHandShakeReturn messagefrom Callee SimpleStream is received and treated
  }

  private _farHandShake() {
    _console.log('SimpleStream farHandShake')

    this._ws.send(  JSON.stringify({
                        calleeSecureHash : this._calleeSecureHash,
                        callerSecureHash : this._myCallerGUID,
                        message : JSON.stringify({
                                      "type"        : "farHandShake",
                                      "callerGUID"  : this._myCallerGUID
                                    })
                      } ))
  }

  private _treatFarHandShakeReturn(callObj) {
    _console.log('treat.farHandShakeReturn', callObj)
    this._mySecureHash = callObj.callerSecureHash
    if (! this._mySecureHash)
      throw "_myCallerSecureHash is empty or invalid in response"
    this._handShakeOkPromise(); // complete the finalPromise instantiated in init method
  }

  private _messageHandler(event :any) {
    _console.log(`SimpleStream Caller message handler : listen by ${this._listeners.length} listeners`)
    let data
    try {
      data = JSON.parse(event.data)
    }
    catch (e) {
      throw "Data from stream is not in the good format"
    }
    let messageObj :any = null
    try {
      messageObj = JSON.parse(data.message)
    }
    catch (e) {
      // it is a raw string message maybe
    }

    if (messageObj && messageObj.type && this._treat[messageObj.type]) {
      // This is the result of the HandShake request (the first request)
      let secureHash
      try {
        secureHash = this._treat[messageObj.type](messageObj)
      }
      catch (e) {
        _console.error(`Error on treat of type(${messageObj.type}) : `, e)
      }
      return secureHash // --> return
    }

    // This is a "normal" stream event, we give it to the listeners
    if (this._listeners) {
      this._listeners.forEach((listener) => listener.cbk(data.message))
    }
  }

  public addEventListener = function(cbk :(args :any) => any) {
    _console.log('addEventListener')
    _console.assert(cbk && typeof cbk === "function",
      "Arg 'cbk' must be provided (function)" )

    let listener = {
      cbk   : cbk,
      arrayIdx : null
    }
    this._listeners.push(listener)

    listener.arrayIdx = this._listenersByType.length - 1
    return this._listeners.length - 1
  }

  public removeEventListener = function(listenerIdx) {
    // pre
    _console.assert( listenerIdx !== undefined && listenerIdx !== null && listenerIdx >= 0,
                    "listenerIdx must be a not null integer")

    let listener = this._listeners[listenerIdx]

    _console.assert(listener, "listener (" + listenerIdx + ") must be a not null, maybe you have removed the listener twice", this._listeners)
    this._listeners[listenerIdx] = undefined
  }
}
