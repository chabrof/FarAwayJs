(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../_debug", "chance"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("../../_debug");
    var Chance = require("chance");
    var SimpleStream = (function () {
        function SimpleStream(host, port, calleeSecureHash) {
            if (host === void 0) { host = "localhost"; }
            if (port === void 0) { port = "8080"; }
            var _this = this;
            this._treat = {};
            this._myCallerGUID = new Chance().guid();
            this.addEventListener = function (cbk) {
                _debug_1._console.log('addEventListener');
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
            _debug_1._console.assert(calleeSecureHash && calleeSecureHash.length, 'calleeSecureHash must be a non null string');
            _debug_1._console.log('host' + host, "port" + port);
            this._host = host;
            this._port = port;
            this._listeners = [];
            this._listenersByType = {};
            this._calleeSecureHash = calleeSecureHash;
            this._treat.farHandShakeReturn = function (data) { return _this._treatFarHandShakeReturn(data); };
        }
        SimpleStream.prototype.init = function () {
            var _this = this;
            _debug_1._console.assert(this._ws === undefined, "You have already init the WebSocket listening");
            var wsServer = "ws://" + this._host + ":" + this._port;
            this._ws = new WebSocket(wsServer);
            var declareWsReady;
            var openingPromise = new Promise(function (ok, ko) { return declareWsReady = ok; });
            this._ws.addEventListener('open', function () { declareWsReady(); });
            this._ws.addEventListener('message', function (event) { return _this._messageHandler(event); }, false);
            var finalPromise = new Promise(function (ok, ko) {
                _this._handShakeOkPromise = ok;
            });
            openingPromise.then(function () { return _this._farHandShake(); });
            return finalPromise; // this promise will be completed when farHandShakeReturn messagefrom Callee SimpleStream is received and treated
        };
        SimpleStream.prototype._farHandShake = function () {
            _debug_1._console.log('SimpleStream farHandShake');
            this._ws.send(JSON.stringify({
                calleeSecureHash: this._calleeSecureHash,
                callerSecureHash: this._myCallerGUID,
                message: JSON.stringify({
                    "type": "farHandShake",
                    "callerGUID": this._myCallerGUID
                })
            }));
        };
        SimpleStream.prototype._treatFarHandShakeReturn = function (callObj) {
            _debug_1._console.log('treat.farHandShakeReturn', callObj);
            this._mySecureHash = callObj.callerSecureHash;
            if (!this._mySecureHash)
                throw "_myCallerSecureHash is empty or invalid in response";
            this._handShakeOkPromise(); // complete the finalPromise instantiated in init method
        };
        SimpleStream.prototype._messageHandler = function (event) {
            _debug_1._console.log("SimpleStream Caller message handler : listen by " + this._listeners.length + " listeners");
            var data;
            try {
                data = JSON.parse(event.data);
            }
            catch (e) {
                throw "Data from stream is not in the good format";
            }
            var messageObj = null;
            try {
                messageObj = JSON.parse(data.message);
            }
            catch (e) {
                // it is a raw string message maybe
            }
            if (messageObj && messageObj.type && this._treat[messageObj.type]) {
                // This is the result of the HandShake request (the first request)
                var secureHash = void 0;
                try {
                    secureHash = this._treat[messageObj.type](messageObj);
                }
                catch (e) {
                    _debug_1._console.error("Error on treat of type(" + messageObj.type + ") : ", e);
                }
                return secureHash; // --> return
            }
            // This is a "normal" stream event, we give it to the listeners
            if (this._listeners) {
                this._listeners.forEach(function (listener) { return listener.cbk(data.message); });
            }
        };
        return SimpleStream;
    }());
    exports.SimpleStream = SimpleStream;
});
//# sourceMappingURL=simple_stream.js.map