import { _console } from "../../_debug"

class SimpleStream {
  private _ws :WebSocket
  private _host :string
  private _port :string
  private _listeners :any[]
  private _listenersByType :any

  constructor () {
    this._listeners = []
    this._listenersByType = {}
  }

  public init() :Promise<void> {
    _console.assert(this._ws === undefined, "You have already init the WebSocket listening")

    let wsServer = `ws://${this._host}:${this._port}`
    this._ws = new WebSocket(wsServer)
    let declareWsReady
    let promise = new Promise<void>((ok, ko) => declareWsReady = ok)

    this._ws.addEventListener('open', function() { declareWsReady() })
    this._ws.addEventListener('message', (event) => this._messageHandler(event), false)
    return promise
  }

  private _messageHandler(event :MessageEvent) {
    let listeners = this._listenersByType[event.type]

    if (listeners) {
      listeners.forEach(
        (listener) => {
          _console.assert(listener.cbk, 'cbk is not defined for listener')
          listener.cbk(event)
        })
    }
  }

  public addEventListener = function(type :string, cbk :(args :any) => any) {
    // pre
    _console.assert(
      typeof type === "string" && typeof cbk === "function" && type && cbk,
      "Arg 'Type' (string) of event must be given, as well as cbk (function)" )

    let listener = {
      type  : type,
      cbk   : cbk,
      arrayIdx : null
    }
    this._listeners.push(listener)
    if (! this._listenersByType[type]) {
      this._listenersByType[type] = []
    }
    this._listenersByType[type].push(listener)
    listener.arrayIdx = this._listenersByType[type].length - 1
    return this._listeners.length - 1
  }

  public removeEventListener = function(listenerIdx) {
    // pre
    _console.assert( listenerIdx !== undefined && listenerIdx !== null && listenerIdx >= 0,
                    "listenerIdx must be a not null integer")

    let listener = this._listeners[listenerIdx]

    _console.assert(listener, "listener (" + listenerIdx + ") must be a not null, maybe you have removed the listener twice", this._listeners)

    let type = listener.type
    this._listenersByType[type].splice(listener.arrayIdx, 1)
    for (let idx = listener.arrayIdx + 1; idx < this._listenersByType[type].length; idx++) {
      _console.assert(this._listenersByType[type][idx].arrayIdx >= 0, 'arrayIdx for a listener event must be an integer');
      --(this._listenersByType[type][idx].arrayIdx)
    }
    this._listeners[listenerIdx] = undefined
  }
}
