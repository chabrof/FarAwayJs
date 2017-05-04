(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../_debug"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("../../_debug");
    var WS = (function () {
        function WS(host, port, options) {
            if (host === void 0) { host = "localhost"; }
            if (port === void 0) { port = "8080"; }
            _debug_1._console.assert(host && host.length, 'host must be a non null string');
            _debug_1._console.assert(port && port.length, 'port must be a non null string');
            this._host = host;
            this._port = port;
        }
        WS.prototype.onMessage = function (handler) {
            this._clientMessageHandler = handler;
        };
        WS.prototype._messageHandler = function (event) {
            var data = JSON.parse(event.data);
            this._clientMessageHandler(data.message);
        };
        WS.prototype.initListening = function () {
            var _this = this;
            _debug_1._console.assert(this._ws === undefined, "You have already init the WebSocket listening");
            var wsServer = "ws://" + this._host + ":" + this._port;
            this._ws = new WebSocket(wsServer);
            var declareWsReady;
            var promise = new Promise(function (ok, ko) { return declareWsReady = ok; });
            this._ws.addEventListener('open', function () { declareWsReady(); });
            this._ws.addEventListener('message', function (event) { return _this._messageHandler(event); });
            return promise;
        };
        WS.prototype.send = function (srcSecureHash, destSecureHash, message) {
            this._ws.send(JSON.stringify({ srcSecureHash: srcSecureHash, destSecureHash: destSecureHash, message: message }));
        };
        return WS;
    }());
    exports.WS = WS;
});
//# sourceMappingURL=web_socket.js.map