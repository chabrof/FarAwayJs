(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../_debug", "ws"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("../../_debug");
    var ws_1 = require("ws");
    var WSS = (function () {
        function WSS(host, port, options) {
            if (host === void 0) { host = "localhost"; }
            if (port === void 0) { port = "8080"; }
            this._clientMessageHandlers = [];
            this._wsTab = [];
            this._GUIDToSocket = {};
            this._secureHashToSocket = {};
            this._secureHashToGUID = {};
            _debug_1._console.assert(host && host.length, 'host must be a non null string');
            _debug_1._console.assert(port && port.length, 'port must be a non null string');
            this._host = host;
            this._port = port;
        }
        WSS.prototype.onMessage = function (secureHash, handler, mainClient) {
            if (mainClient === void 0) { mainClient = true; }
            this._clientMessageHandlers[secureHash] = handler;
            if (mainClient)
                this._mainClientHandler = handler;
        };
        WSS.prototype.initListening = function () {
            var _this = this;
            _debug_1._console.assert(this._wss === undefined, "You have already init the WebSocket server");
            this._wss = new ws_1.Server({ port: parseInt(this._port) });
            var declareWsReady;
            var promise = new Promise(function (ok, ko) { return declareWsReady = ok; });
            this._wss.on('connection', function (ws) {
                _this._wsTab.push(ws);
                _debug_1._console.log('');
                _debug_1._console.log('****');
                _debug_1._console.log("Connection new client (among " + _this._wsTab.length + " clients)", ws.readyState);
                _debug_1._console.log('****');
                _debug_1._console.log('');
                ws.on('message', function (message) { return _this._treatIncomingMessage(ws, message); });
                declareWsReady();
            });
            return promise;
        };
        WSS.prototype._treatIncomingMessage = function (ws /*:WebSocket*/, message) {
            var messageObj = JSON.parse(message);
            _debug_1._console.log('');
            _debug_1._console.log('Received message :');
            _debug_1._console.log(message);
            _debug_1._console.log('');
            if (!this._secureHashToGUID[messageObj.srcSecureHash]) {
                // The secure HASH is for the first a simple GUID => we store temporary the client socket in a hash
                this._GUIDToSocket[messageObj.srcSecureHash] = ws;
            }
            if (!messageObj.dstSecureHash) {
                this._mainClientHandler(messageObj.message);
            }
            else {
                this._clientMessageHandlers[messageObj.dstSecureHash](messageObj.message);
            }
        };
        WSS.prototype.registerSecureHash = function (GUID, secureHash) {
            _debug_1._console.assert(GUID && GUID.length, 'GUID must be a non null string');
            _debug_1._console.assert(secureHash && secureHash.length, 'secureHash must be a non null string');
            _debug_1._console.assert(this._GUIDToSocket[GUID], 'GUID must have been stored as an id for socket in Communication instance');
            this._secureHashToSocket[secureHash] = this._GUIDToSocket[GUID];
            this._secureHashToGUID[secureHash] = GUID;
            this._GUIDToSocket[GUID] = undefined;
        };
        WSS.prototype.send = function (srcSecureHash, destSecureHash, message) {
            var socket = this._secureHashToSocket[destSecureHash];
            if (socket.readyState === ws_1.OPEN) {
                socket.send(JSON.stringify({ srcSecureHash: srcSecureHash, message: message }));
            }
            else {
                _debug_1._console.error('The socket of the caller seems not to be in readyState');
            }
        };
        return WSS;
    }());
    exports.WSS = WSS;
});
//# sourceMappingURL=wss.js.map