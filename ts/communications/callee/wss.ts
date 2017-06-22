import { FACalleeCommunication, FAMessageObj } from "../../interfaces"
import { _console } from "../../_debug"
import { generateError } from "../../error"
import { Server, OPEN } from "ws"


interface CallersWSInfo {
  GUIDToSocket :any
  secureHashToSocket :any
  secureHashToGUID :any
}

export class WSS implements FACalleeCommunication {
  private _wss :Server
  private _calleeMessageHandlers :((data :string) => string)[] = []
  private _mainCalleeSecureHash :string
  private _host :string
  private _port :string
  private _wsTab :any[] = []
  private _callersWSInfo :{[secureHash :string]:CallersWSInfo} = {}

  constructor(host :string = "localhost", port :string = "8080", options? :any) {
    _console.assert(host && host.length, 'host must be a non null string')
    _console.assert(port && port.length, 'port must be a non null string')

    this._host = host
    this._port = port
  }

  public onMessage(calleeSecureHash :string, handler :(data :string) => string, mainClient :boolean = false) {
    this._calleeMessageHandlers[calleeSecureHash] = handler
    this._callersWSInfo[calleeSecureHash] = {
        GUIDToSocket        : {},
        secureHashToSocket  : {},
        secureHashToGUID    : {}
      }
    if (mainClient)
      this._mainCalleeSecureHash = calleeSecureHash
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
    _console.log("\n\nReceived message :")
    _console.log(`${message}\n`)
    let calleeSecureHash = (messageObj.calleeSecureHash ? messageObj.calleeSecureHash : this._mainCalleeSecureHash);
    let callerWSInfos :CallersWSInfo = this._callersWSInfo[calleeSecureHash]

    _console.assert(callerWSInfos, "The callee is not known, not possible to get back its callers' infos")
    if (! callerWSInfos.secureHashToGUID[messageObj.callerSecureHash]) {
      // The secure HASH is, for the first caller request, a simple GUID => we store temporary the client socket in a hash
      callerWSInfos.GUIDToSocket[messageObj.callerSecureHash] = ws
    }
    _console.assert(typeof this._calleeMessageHandlers[calleeSecureHash] === 'function', 'The collee Handler have not been initialysed')
    _console.log(` Targeted Callee : ${calleeSecureHash}\n`)
    this._calleeMessageHandlers[calleeSecureHash](messageObj.message)
  }

  public registerCallerSecureHash(calleeSecureHash :string, callerGUID :string, callerSecureHash :string) {
    _console.assert(callerGUID && callerGUID.length, 'callerGUID must be a non null string')
    _console.assert(callerSecureHash && callerSecureHash.length, 'callerSecureHash must be a non null string')

    let callerWSInfos :CallersWSInfo = this._callersWSInfo[calleeSecureHash]
    _console.assert(callerWSInfos, `The callee (${calleeSecureHash}) is not known, not possible to get back its callers' infos`, this._callersWSInfo)
    _console.assert(callerWSInfos.GUIDToSocket[callerGUID], 'GUID must have been stored as an id for socket in Communication instance')

    callerWSInfos.secureHashToSocket[callerSecureHash] = callerWSInfos.GUIDToSocket[callerGUID]
    callerWSInfos.secureHashToGUID[callerSecureHash] = callerGUID
    callerWSInfos.GUIDToSocket[callerGUID] = undefined
  }

  public send(calleeSecureHash :string, callerSecureHash :string, message :string) {
    let callerWSInfos :CallersWSInfo = this._callersWSInfo[calleeSecureHash]
    _console.assert(callerWSInfos, "The callee is not known, not possible to get back its callers' infos")

    if (callerSecureHash) {
      let socket = callerWSInfos.secureHashToSocket[callerSecureHash]
      this._send(calleeSecureHash, socket, message)
    }
    else {
      // Kind of "broadCast"
      for (let i in callerWSInfos.secureHashToSocket) {
        this._send(calleeSecureHash, callerWSInfos.secureHashToSocket[i], message)
      }
    }
  }

  private _send(calleeSecureHash :string, socket, message :string) {
    if (socket.readyState === OPEN) {
      socket.send(JSON.stringify({ calleeSecureHash, message }))
    }
    else {
      _console.error('The socket of the caller seems not to be in readyState')
    }
  }
}
