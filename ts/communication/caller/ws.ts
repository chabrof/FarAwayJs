import { FACommunication } from "../../interfaces"
import { _console } from "../../_debug"
import { generateError } from "../../error"

export class WS implements FACommunication {
  private _ws :WebSocket
  private _clientMessageHandler :(data :string) => string
  private _host :string
  private _port :string

  constructor(host :string = "localhost", port :string = "8080", options? :any) {
    _console.assert(host && host.length, 'host must be a non null string')
    _console.assert(port && port.length, 'port must be a non null string')

    this._host = host
    this._port = port
  }

  public onMessage(handler :(data :string) => string) {
    this._clientMessageHandler = handler
  }

  private _messageHandler(event) {
    let data = JSON.parse(event.data)
    this._clientMessageHandler(data.message)
  }

  public initListening() :Promise<void> {
    _console.assert(this._ws === undefined, "You have already init the WebSocket listening")

    let wsServer = `ws://${this._host}:${this._port}`
    this._ws = new WebSocket(wsServer)
    let declareWsReady
    let promise = new Promise<void>((ok, ko) => declareWsReady = ok)

    this._ws.addEventListener('open', function() { declareWsReady() })
    this._ws.addEventListener('message', (event) => this._messageHandler(event))
    return promise
  }

  public send(srcSecureHash :string, message :string) {
    this._ws.send(JSON.stringify({ srcSecureHash, message }))
  }
}
