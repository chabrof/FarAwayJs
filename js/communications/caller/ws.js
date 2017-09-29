import { _console } from "../../_debug";
export class WS {
    constructor(host = "localhost", port = "8080", options) {
        _console.assert(host && host.length, 'host must be a non null string');
        _console.assert(port && port.length, 'port must be a non null string');
        this._host = host;
        this._port = port;
    }
    onMessage(handler) {
        this._clientMessageHandler = handler;
    }
    _messageHandler(event) {
        let data = JSON.parse(event.data);
        //console.log('--> Raw data', data);
        this._clientMessageHandler(data);
    }
    initListening() {
        _console.assert(this._ws === undefined, "You have already init the WebSocket listening");
        let wsServer = `ws://${this._host}:${this._port}`;
        this._ws = new WebSocket(wsServer);
        let declareWsReady;
        let promise = new Promise((ok, ko) => declareWsReady = ok);
        this._ws.addEventListener('open', function () { declareWsReady(); });
        this._ws.addEventListener('message', (event) => this._messageHandler(event));
        return promise;
    }
    send(calleeSecureHash, callerSecureHash, message) {
        this._ws.send(JSON.stringify({ calleeSecureHash, callerSecureHash, message }));
    }
}
