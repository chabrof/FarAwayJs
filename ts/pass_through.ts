import { Server, OPEN } from "ws"
import { _console } from "./_debug"

let wss = new Server({ port: 8080 })
let wsTab = []

function sendToOthers(message, ws) {
  for (let ct = 0; ct < wsTab.length; ct++) {
    if (wsTab[ct] !== ws) {
      if (wsTab[ct].readyState === OPEN) {
        wsTab[ct].send(message)
      }
    }
  }
}

wss.on('connection', function connection(ws) {
  wsTab.push(ws)
  _console.log('connection client', ws.readyState)
  ws.on('message', function incoming(message) {
    //_console.log('received: %s', message)
    sendToOthers(message, ws)
  })
})
