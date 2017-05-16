import { _console } from "../../_debug"
import { CallerBackCreate } from "../../interfaces"

export class SimpleStream implements CallerBackCreate {
  private _ws :WebSocket
  private _host :string
  private _port :string
  private _listeners :any[]
  private _listenersByType :any

  constructor (host :string = "localhost", port :string = "8080", options? :any) {
    _console.assert(host && host.length, 'host must be a non null string')
    _console.assert(port && port.length, 'port must be a non null string')
    _console.log('host' + host, "port" + port)
    this._host = host
    this._port = port
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
    if (this._listeners) {
      this._listeners.forEach((listener) => listener.cbk(event))
    }
  }

  public addEventListener = function(cbk :(args :any) => any) {
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
