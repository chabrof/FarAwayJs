import { Server, OPEN } from "ws"
import { _console } from "./_debug"
import { FAMessageObj } from "./interfaces"

let wss = new Server({ port: 8080 })
let wsTab = []
let calleeServerSHash :string // the callee server (where we call remote object)

let secureHashToSocketClient = {}
let GUIDToSocketClient = {}

function sendToDest(message, ws) {
  for (let ct = 0; ct < wsTab.length; ct++) {
    if (wsTab[ct] !== ws) {
      if (wsTab[ct].readyState === OPEN) {
        wsTab[ct].send(message)
      }
    }
  }
}

function _identifySrc(messageObj :FAMessageObj) {
  secureHashToSocketClient[messageObj.srcSecureHash] = socketCLient
}

wss.on('connection', function connection(ws) {
  wsTab.push(ws)
  _console.log('connection client', ws.readyState)

  ws.on('message', function incoming(message) {
    let messageObj :FAMessageObj = JSON.parse(message)
    _identifySrc(messageObj)

    //_console.log('received: %s', message)
    sendToDest(message, ws)
  })
})
