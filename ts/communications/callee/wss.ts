import { FACalleeCommunication, FAMessageObj } from "../../interfaces"
import { _console } from "../../_debug"
import { generateError } from "../../error"
import { Server, OPEN } from "ws"

export class WSS implements FACalleeCommunication {
  private _wss :Server
  private _clientMessageHandlers :((data :string) => string)[] = []
  private _mainClientHandler :((data :string) => string)
  private _host :string
  private _port :string
  private _wsTab :any[] = []
  private _GUIDToSocket :any = {}
  private _secureHashToSocket :any = {}
  private _secureHashToGUID :any = {}

  constructor(host :string = "localhost", port :string = "8080", options? :any) {
    _console.assert(host && host.length, 'host must be a non null string')
    _console.assert(port && port.length, 'port must be a non null string')

    this._host = host
    this._port = port
  }

  public onMessage(secureHash :string, handler :(data :string) => string, mainClient :boolean = true) {
    this._clientMessageHandlers[secureHash] = handler
    if (mainClient)
      this._mainClientHandler = handler
  }

  public initListening() :Promise<void> {
    _console.assert(this._wss === undefined, "You have already init the WebSocket server")

    this._wss = new Server({ port: parseInt(this._port) })
    let declareWsReady
    let promise = new Promise<void>((ok, ko) => declareWsReady = ok)

    this._wss.on('connection', (ws) => {
      this._wsTab.push(ws)
      _console.log('')
      _console.log('****')
      _console.log(`Connection new client (among ${this._wsTab.length} clients)`, ws.readyState)
      _console.log('****')
      _console.log('')

      ws.on('message', (message) => this._treatIncomingMessage(ws, message))
      declareWsReady()
    })
    return promise
  }

  private _treatIncomingMessage(ws :any /*:WebSocket*/, message :string) {
    let messageObj :FAMessageObj = JSON.parse(message)
    _console.log('')
    _console.log('Received message :')
    _console.log(message)
    _console.log('')

    if (! this._secureHashToGUID[messageObj.srcSecureHash]) {
      // The secure HASH is for the first a simple GUID => we store temporary the client socket in a hash
      this._GUIDToSocket[messageObj.srcSecureHash] = ws
    }

    if (! messageObj.dstSecureHash) {
      this._mainClientHandler(messageObj.message)
    }
    else {
      this._clientMessageHandlers[messageObj.dstSecureHash](messageObj.message)
    }
  }

  public registerSecureHash(GUID :string, secureHash :string) {
    _console.assert(GUID && GUID.length, 'GUID must be a non null string')
    _console.assert(secureHash && secureHash.length, 'secureHash must be a non null string')
    _console.assert(this._GUIDToSocket[GUID], 'GUID must have been stored as an id for socket in Communication instance')

    this._secureHashToSocket[secureHash] = this._GUIDToSocket[GUID]
    this._secureHashToGUID[secureHash] = GUID
    this._GUIDToSocket[GUID] = undefined
  }

  public send(srcSecureHash :string, destSecureHash :string, message :string) {
    let socket = this._secureHashToSocket[destSecureHash]

    if (socket.readyState === OPEN) {
      socket.send(JSON.stringify({ srcSecureHash, message }))
    }
    else {
      _console.error('The socket of the caller seems not to be in readyState')
    }
  }
}
