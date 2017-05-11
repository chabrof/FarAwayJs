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
        function SimpleStream() {
            this.addEventListener = function (type, cbk) {
                // pre
                _debug_1._console.assert(typeof type === "string" && typeof cbk === "function" && type && cbk, "Arg 'Type' (string) of event must be given, as well as cbk (function)");
                var listener = {
                    type: type,
                    cbk: cbk,
                    arrayIdx: null
                };
                this._listeners.push(listener);
                if (!this._listenersByType[type]) {
                    this._listenersByType[type] = [];
                }
                this._listenersByType[type].push(listener);
                listener.arrayIdx = this._listenersByType[type].length - 1;
                return this._listeners.length - 1;
            };
            this.removeEventListener = function (listenerIdx) {
                // pre
                _debug_1._console.assert(listenerIdx !== undefined && listenerIdx !== null && listenerIdx >= 0, "listenerIdx must be a not null integer");
                var listener = this._listeners[listenerIdx];
                _debug_1._console.assert(listener, "listener (" + listenerIdx + ") must be a not null, maybe you have removed the listener twice", this._listeners);
                var type = listener.type;
                this._listenersByType[type].splice(listener.arrayIdx, 1);
                for (var idx = listener.arrayIdx + 1; idx < this._listenersByType[type].length; idx++) {
                    _debug_1._console.assert(this._listenersByType[type][idx].arrayIdx >= 0, 'arrayIdx for a listener event must be an integer');
                    --(this._listenersByType[type][idx].arrayIdx);
                }
                this._listeners[listenerIdx] = undefined;
            };
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
            var listeners = this._listenersByType[event.type];
            if (listeners) {
                listeners.forEach(function (listener) {
                    _debug_1._console.assert(listener.cbk, 'cbk is not defined for listener');
                    listener.cbk(event);
                });
            }
        };
        return SimpleStream;
    }());
});
//# sourceMappingURL=simple_stream.js.map