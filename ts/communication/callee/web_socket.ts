import { FACommunication } from "../../interfaces"
import { _console } from "../../_debug"
import { generateError } from "../../error"
import { Server, OPEN } from "ws"

export class WS implements FACommunication {
  private _wss :Server
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
    _console.assert(this._ws === undefined, "You have already init the WebSocket server")

    this._wss = new Server({ port: parseInt(this._port) })
    let declareWsReady
    let promise = new Promise<void>((ok, ko) => declareWsReady = ok)

    wss.on('connection', function connection(ws) {
      wsTab.push(ws)
      _console.log('connection client', ws.readyState)

      ws.on('message', (message) => _treatIncomingMessage(ws, message))
      declareWsReady()
    })

    return promise
  }

  _treatIncomingMessage(ws :WebSocket, message :string) {
      let messageObj :FAMessageObj = JSON.parse(message)

      if (messageObj.GUID && ! messageObj.secureId) {
        if (this._GUIDToSocket[messageObj.GUID] !== undefined) {
          generateError(this, 4, 'Client must have a secure Hash except for the first call');
          return
        }

        this._GUIDToSocket[messageObj.GUID] = ws
      }
      _clientMessageHandler(message)
    })
  }

  public registerSecureHash(GUID :string, secureHash :string) {
    console.assert(GUID && GUID.length, 'GUID must be a non null string')
    console.assert(secureHash && secureHash.length, 'secureHash must be a non null string')
    console.assert(this._GUIDToSocket[GUID], 'GUID must have been stored as an id for socket in Communication instance')

    this._secureHashToSocket[secureHash] = this._GUIDToSocket[GUID]
  }

  public send(destSecureHash :string, message :string) {
    let socket = this._secureHashToSocket[destSecureHash]

    if (socket.readyState === OPEN) {
      socket.send(message)
    }
    else {
      _console.error('The socket of the caller seems not to be in readyState')
    }
  }
}
