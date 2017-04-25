(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "FarAwayJs/_debug"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("FarAwayJs/_debug");
    var _callables = {};
    var _rCallIdx = 0;
    var _promiseOkCbksH = {};
    var _wsServer = "ws://localhost:8080";
    var _ws, _wsReadyPromise;
    var _declareWsReady;
    var _treat = {};
    _treat.rError = function (errorObj) {
        _debug_1._console.error("Error on simpleRpc", errorObj.error);
    };
    _treat.rCallReturn = function (callObj) {
        _debug_1._console.log('treat_rCallReturn', callObj, this._promiseOkCbksH);
        if (typeof callObj.rIdx !== "number") {
            throw {
                "message": "rIdx is empty or invalid : " + callObj.rCallrIdx,
                "send": false
            };
        }
        var ret = callObj.return;
        _debug_1._console.log('ici', typeof this._promiseOkCbksH[callObj.rIdx]);
        _promiseOkCbksH[callObj.rIdx](ret); // complete the associated Promise
    };
    _treat.rInstantiateReturn = function (callObj) {
        _debug_1._console.log('treat_rInstantiateReturn', callObj);
        if (typeof callObj.rIdx !== "number") {
            throw {
                "message": "rIdx is empty or invalid : " + callObj.rCallrIdx,
                "send": false
            };
        }
        var instanceRpc = new FarAwayCallerInstance(this, callObj.rIdx);
        this._promiseOkCbksH[callObj.rIdx](instanceRpc); // complete the associated Promise
    };
    var FarAwayCallerInstance = (function () {
        function FarAwayCallerInstance(simpleRpcClient, instanceIdx) {
            this.__farAwayInstIdx__ = instanceIdx;
        }
        FarAwayCallerInstance.prototype.rCall = function (objectName) {
            return rCall(objectName, this.__farAwayInstIdx__);
        };
        return FarAwayCallerInstance;
    }());
    function initWsListening(url, port) {
        if (url === void 0) { url = "localhost"; }
        if (port === void 0) { port = "8080"; }
        _debug_1._console.assert(_ws === undefined, "You have already init the WebSocket listening");
        _ws = new WebSocket(_wsServer);
        _wsReadyPromise = new Promise(function (ok, ko) { _declareWsReady = ok; });
        _ws.addEventListener('open', function () { _declareWsReady(); });
        _ws.addEventListener('message', function (message) {
            console.log('Message received :', message.data.substring(0, 80));
            var messageObj;
            try {
                messageObj = JSON.parse(message.data);
            }
            catch (e) {
                console.log('Exception', e);
                _generateError(3, "Message is not in the good format");
            }
            try {
                _treat[messageObj.type](messageObj);
            }
            catch (e) {
                if (e.send) {
                    _generateError(1, e.message);
                }
                else {
                    _debug_1._console.error('Error : ', e.message);
                }
            }
        });
    }
    exports.initWsListening = initWsListening;
    function _generateError(code, message) {
        _debug_1._console.error('Generate error :', message);
        this._ws.send(JSON.stringify({
            "type": "rError",
            "error": {
                "code": code,
                "message": message
            }
        }));
    }
    function _getRCallIdx() {
        return this._rCallIdx++;
    }
    function _extractArgs(argsIn) {
        var argsOut = [];
        for (var ct = 1; ct < argsIn.length; ct++) {
            argsOut.push(argsIn[ct]);
        }
        return argsOut;
    }
    function rCall(objectName, instanceIdx) {
        var args = arguments;
        _debug_1._console.log('rCall : ', objectName, args);
        if (typeof objectName !== "string" || !objectName.length) {
            throw {
                "message": "Method is empty or invalid : " + objectName,
                "send": false
            };
        }
        args = _extractArgs(args);
        var idx = _getRCallIdx();
        var promise = new Promise(function (ok, ko) { _promiseOkCbksH[idx] = ok; });
        _wsReadyPromise.then(function () {
            _ws.send(JSON.stringify({
                "type": "rCall",
                "objectName": objectName,
                "args": args,
                "instanceIdx": instanceIdx,
                "rIdx": idx
            }));
        });
        return promise;
    }
    function rInstantiate(constructorName) {
        console.log('rInstantiate : ', constructorName);
        var idx = this._getRCallIdx();
        var argsObj = arguments;
        var argsArray = [];
        for (var i in argsObj) {
            argsArray.push(argsObj[i]);
        }
        var promise = new Promise(function (ok, ko) { _promiseOkCbksH[idx] = ok; });
        this._wsReadyPromise.then(function () {
            _ws.send(JSON.stringify({
                "type": "rInstantiate",
                "constructorName": constructorName,
                "rIdx": idx,
                "args": argsArray
            }));
        });
        return promise;
    }
    exports.rInstantiate = rInstantiate;
});
//# sourceMappingURL=far_away_caller.js.map