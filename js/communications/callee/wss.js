import { _console } from "../../_debug";
import { Server, OPEN } from "ws";
export class WSS {
    constructor(host = "localhost", port = "8080", options) {
        this._calleeMessageHandlers = [];
        this._wsTab = [];
        this._callersWSInfo = {};
        _console.assert(host && host.length, 'host must be a non null string');
        _console.assert(port && port.length, 'port must be a non null string');
        this._host = host;
        this._port = port;
    }
    get host() { return this._host; }
    get port() { return this._port; }
    onMessage(calleeSecureHash, handler, mainClient = false) {
        this._calleeMessageHandlers[calleeSecureHash] = handler;
        this._callersWSInfo[calleeSecureHash] = {
            GUIDToSocket: {},
            secureHashToSocket: {},
            secureHashToGUID: {}
        };
        if (mainClient)
            this._mainCalleeSecureHash = calleeSecureHash;
    }
    initListening() {
        _console.assert(this._wss === undefined, "You have already init the WebSocket server");
        this._wss = new Server({ port: parseInt(this._port) });
        let declareWsReady;
        let promise = new Promise((ok, ko) => declareWsReady = ok);
        this._wss.on('connection', (ws) => {
            this._wsTab.push(ws);
            _console.log('');
            _console.log('****');
            _console.log(`Connection new client (among ${this._wsTab.length} clients)`, ws.readyState);
            _console.log('****');
            _console.log('');
            ws.on('message', (message) => this._treatIncomingMessage(ws, message));
            declareWsReady();
        });
        return promise;
    }
    _treatIncomingMessage(ws /*:WebSocket*/, message) {
        let messageObj = JSON.parse(message);
        _console.log("\n\nReceived message :");
        _console.log(`${message}\n`);
        let calleeSecureHash = (messageObj.calleeSecureHash ? messageObj.calleeSecureHash : this._mainCalleeSecureHash);
        let callerWSInfos = this._callersWSInfo[calleeSecureHash];
        _console.assert(callerWSInfos, "The callee is not known, not possible to get back its callers' infos");
        if (!callerWSInfos.secureHashToGUID[messageObj.callerSecureHash]) {
            // The secure HASH is, for the first caller request, a simple GUID => we store temporary the client socket in a hash
            callerWSInfos.GUIDToSocket[messageObj.callerSecureHash] = ws;
        }
        _console.assert(typeof this._calleeMessageHandlers[calleeSecureHash] === 'function', 'The collee Handler have not been initialysed');
        _console.log(` Targeted Callee : ${calleeSecureHash}\n`);
        this._calleeMessageHandlers[calleeSecureHash](messageObj.message);
    }
    registerCallerSecureHash(calleeSecureHash, callerGUID, callerSecureHash) {
        _console.assert(callerGUID && callerGUID.length, 'callerGUID must be a non null string');
        _console.assert(callerSecureHash && callerSecureHash.length, 'callerSecureHash must be a non null string');
        let callerWSInfos = this._callersWSInfo[calleeSecureHash];
        _console.assert(callerWSInfos, `The callee (${calleeSecureHash}) is not known, not possible to get back its callers' infos`, this._callersWSInfo);
        _console.assert(callerWSInfos.GUIDToSocket[callerGUID], 'GUID must have been stored as an id for socket in Communication instance');
        callerWSInfos.secureHashToSocket[callerSecureHash] = callerWSInfos.GUIDToSocket[callerGUID];
        callerWSInfos.secureHashToGUID[callerSecureHash] = callerGUID;
        callerWSInfos.GUIDToSocket[callerGUID] = undefined;
    }
    send(calleeSecureHash, callerSecureHash, message) {
        let callerWSInfos = this._callersWSInfo[calleeSecureHash];
        _console.assert(callerWSInfos, "The callee is not known, not possible to get back its callers' infos");
        if (callerSecureHash) {
            let socket = callerWSInfos.secureHashToSocket[callerSecureHash];
            this._send(calleeSecureHash, socket, message);
        }
        else {
            // Kind of "broadCast"
            for (let i in callerWSInfos.secureHashToSocket) {
                this._send(calleeSecureHash, callerWSInfos.secureHashToSocket[i], message);
            }
        }
    }
    _send(calleeSecureHash, socket, message) {
        if (socket.readyState === OPEN) {
            socket.send(JSON.stringify({ calleeSecureHash, message }));
        }
        else {
            _console.error('The socket of the caller seems not to be in readyState');
        }
    }
}
