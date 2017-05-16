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
    var SimpleStream = (function () {
        function SimpleStream(host, port, options) {
            if (host === void 0) { host = "localhost"; }
            if (port === void 0) { port = "8080"; }
            this.addEventListener = function (cbk) {
                _debug_1._console.assert(cbk && typeof cbk === "function", "Arg 'cbk' must be provided (function)");
                var listener = {
                    cbk: cbk,
                    arrayIdx: null
                };
                this._listeners.push(listener);
                listener.arrayIdx = this._listenersByType.length - 1;
                return this._listeners.length - 1;
            };
            this.removeEventListener = function (listenerIdx) {
                // pre
                _debug_1._console.assert(listenerIdx !== undefined && listenerIdx !== null && listenerIdx >= 0, "listenerIdx must be a not null integer");
                var listener = this._listeners[listenerIdx];
                _debug_1._console.assert(listener, "listener (" + listenerIdx + ") must be a not null, maybe you have removed the listener twice", this._listeners);
                this._listeners[listenerIdx] = undefined;
            };
            _debug_1._console.assert(host && host.length, 'host must be a non null string');
            _debug_1._console.assert(port && port.length, 'port must be a non null string');
            _debug_1._console.log('host' + host, "port" + port);
            this._host = host;
            this._port = port;
            this._listeners = [];
            this._listenersByType = {};
        }
        SimpleStream.prototype.init = function () {
            var _this = this;
            _debug_1._console.assert(this._ws === undefined, "You have already init the WebSocket listening");
            var wsServer = "ws://" + this._host + ":" + this._port;
            this._ws = new WebSocket(wsServer);
            var declareWsReady;
            var promise = new Promise(function (ok, ko) { return declareWsReady = ok; });
            this._ws.addEventListener('open', function () { declareWsReady(); });
            this._ws.addEventListener('message', function (event) { return _this._messageHandler(event); }, false);
            return promise;
        };
        SimpleStream.prototype._messageHandler = function (event) {
            if (this._listeners) {
                this._listeners.forEach(function (listener) { return listener.cbk(event); });
            }
        };
        return SimpleStream;
    }());
    exports.SimpleStream = SimpleStream;
});
//# sourceMappingURL=simple_stream.js.map