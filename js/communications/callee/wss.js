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
            this._calleeMessageHandlers = [];
            this._wsTab = [];
            this._callersWSInfo = {};
            _debug_1._console.assert(host && host.length, 'host must be a non null string');
            _debug_1._console.assert(port && port.length, 'port must be a non null string');
            this._host = host;
            this._port = port;
        }
        WSS.prototype.onMessage = function (calleeSecureHash, handler, mainClient) {
            if (mainClient === void 0) { mainClient = false; }
            this._calleeMessageHandlers[calleeSecureHash] = handler;
            this._callersWSInfo[calleeSecureHash] = {
                GUIDToSocket: {},
                secureHashToSocket: {},
                secureHashToGUID: {}
            };
            if (mainClient)
                this._mainCalleeSecureHash = calleeSecureHash;
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
            _debug_1._console.log("\n\nReceived message :");
            _debug_1._console.log(message + "\n");
            var calleeSecureHash = (messageObj.calleeSecureHash ? messageObj.calleeSecureHash : this._mainCalleeSecureHash);
            var callerWSInfos = this._callersWSInfo[calleeSecureHash];
            _debug_1._console.assert(callerWSInfos, "The callee is not known, not possible to get back its callers' infos");
            if (!callerWSInfos.secureHashToGUID[messageObj.callerSecureHash]) {
                // The secure HASH is, for the first caller request, a simple GUID => we store temporary the client socket in a hash
                callerWSInfos.GUIDToSocket[messageObj.callerSecureHash] = ws;
            }
            _debug_1._console.assert(typeof this._calleeMessageHandlers[calleeSecureHash] === 'function', 'The collee Handler have not been initialysed');
            _debug_1._console.log(" Targeted Callee : " + calleeSecureHash + "\n");
            this._calleeMessageHandlers[calleeSecureHash](messageObj.message);
        };
        WSS.prototype.registerCallerSecureHash = function (calleeSecureHash, callerGUID, callerSecureHash) {
            _debug_1._console.assert(callerGUID && callerGUID.length, 'callerGUID must be a non null string');
            _debug_1._console.assert(callerSecureHash && callerSecureHash.length, 'callerSecureHash must be a non null string');
            var callerWSInfos = this._callersWSInfo[calleeSecureHash];
            _debug_1._console.assert(callerWSInfos, "The callee (" + calleeSecureHash + ") is not known, not possible to get back its callers' infos", this._callersWSInfo);
            _debug_1._console.assert(callerWSInfos.GUIDToSocket[callerGUID], 'GUID must have been stored as an id for socket in Communication instance');
            callerWSInfos.secureHashToSocket[callerSecureHash] = callerWSInfos.GUIDToSocket[callerGUID];
            callerWSInfos.secureHashToGUID[callerSecureHash] = callerGUID;
            callerWSInfos.GUIDToSocket[callerGUID] = undefined;
        };
        WSS.prototype.send = function (calleeSecureHash, callerSecureHash, message) {
            var callerWSInfos = this._callersWSInfo[calleeSecureHash];
            _debug_1._console.assert(callerWSInfos, "The callee is not known, not possible to get back its callers' infos");
            if (callerSecureHash) {
                var socket = callerWSInfos.secureHashToSocket[callerSecureHash];
                this._send(calleeSecureHash, socket, message);
            }
            else {
                // Kind of "broadCast"
                for (var i in callerWSInfos.secureHashToSocket) {
                    this._send(calleeSecureHash, callerWSInfos.secureHashToSocket[i], message);
                }
            }
        };
        WSS.prototype._send = function (calleeSecureHash, socket, message) {
            if (socket.readyState === ws_1.OPEN) {
                socket.send(JSON.stringify({ calleeSecureHash: calleeSecureHash, message: message }));
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