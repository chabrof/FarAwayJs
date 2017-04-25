(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./_debug"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("./_debug");
    var _callables = {};
    var _rCallIdx = 0;
    var _wsServer = "ws://localhost:8080";
    var _ws, _wsReadyPromise;
    var _declareWsReady;
    var _instancesH = {};
    function usePassThroughWsServer(url, port) {
        if (url === void 0) { url = "localhost"; }
        if (port === void 0) { port = "8080"; }
        _ws = new WebSocket(_wsServer);
        _wsReadyPromise = new Promise(function (ok, ko) { _declareWsReady = ok; });
        _ws.addEventListener('open', function () { _declareWsReady(); });
        _ws.addEventListener('message', function (message) {
            var messageObj;
            try {
                messageObj = JSON.parse(message.data);
            }
            catch (e) {
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
    exports.usePassThroughWsServer = usePassThroughWsServer;
    function regInstantiable(object, excludeCalls, objectName) {
        if (objectName === void 0) { objectName = undefined; }
        _debug_1._console.assert(typeof object === 'function' && object, 'Entity must be a not null function (' + object + ' given)');
        _callables[objectName ? objectName : object.name] = new CallableObject(object, "instantiable", excludeCalls);
    }
    exports.regInstantiable = regInstantiable;
    var CallableObject = (function () {
        function CallableObject(object, type, excludeCalls) {
            if (excludeCalls === void 0) { excludeCalls = []; }
            this.stucture = {};
            this.type = type;
            this.object = object;
            this._excludeCalls = excludeCalls;
            this.stucture = this._exploreObject(this.object);
        }
        CallableObject.prototype._exploreObject = function (object) {
            if (this.type === "function")
                return null; // --> return
            var objectStruct = { __prototype__: {} };
            for (var i in object) {
                if (this._excludeCalls.indexOf(i) === -1)
                    objectStruct[i] = typeof object[i];
            }
            if (object.prototype) {
                for (var i in object.prototype) {
                    if (this._excludeCalls.indexOf(i) === -1)
                        objectStruct.__prototype__[i] = typeof object[i];
                }
            }
            return objectStruct;
        };
        return CallableObject;
    }());
    function regFunction(func, funcName) {
        console.assert(typeof func === 'function', 'func must be a not null function (' + func + ' given)');
        _callables[funcName ? funcName : funcName.name] = new CallableObject(func, "function");
    }
    exports.regFunction = regFunction;
    var _treat = {};
    _treat.rInstantiate = function (constructorObj) {
        _debug_1._console.log('treat.rInstantiate', constructorObj);
        var Constructor = _extractConstructorReferenceWName(constructorObj.constructorName);
        try {
            constructorObj.args.unshift(null);
            var instance = new (Function.prototype.bind.apply(Constructor, constructorObj.args));
            _instancesH[constructorObj.rIdx] = instance;
        }
        catch (e) {
            throw constructorObj.constructorName + "seems not to be a valid constructor";
        }
        _ws.send(JSON.stringify({
            "type": "rInstantiateReturn",
            "rIdx": constructorObj.rIdx
        }));
    };
    _treat.rCall = function (callObj) {
        _debug_1._console.log('treat.rCall', callObj);
        if (typeof callObj.objectName !== "string" || !callObj.objectName.length) {
            throw {
                "message": "objectName is empty or invalid : " + callObj.objectName,
                "send": true
            };
        }
        var obj = _extractObjectReferenceWName(callObj.objectName, callObj.args, callObj.instanceIdx);
        var ret = obj();
        if (ret instanceof Promise) {
            ret
                .then(function (ret) { _sendRCallReturn(callObj, ret); })
                .catch(function (error) { _generateError(10, error); });
        }
        else {
            _sendRCallReturn(callObj, ret);
        }
    };
    _treat.rImport = function (callObj) {
        if (typeof callObj.symbols !== "object" || !callObj.symbols.length) {
            throw {
                "message": "List of symbols is empty or invalid : " + callObj.symbols,
                "send": true
            };
        }
        var result = [];
        callObj.forEach(function (symbol) {
            if (!_callables[symbol]) {
                throw {
                    "message": "Symbol '" + symbol + "' does not exist in callee",
                    "send": true
                };
            }
            result.push(_callables[symbol]);
        });
        _ws.send(JSON.stringify({
            "type": "rImportReturn",
            "rIdx": callObj.rIdx,
            "objects": result
        }));
    };
    function _sendRCallReturn(callObj, ret) {
        _debug_1._console.log('_sendRCallReturn', ret);
        _ws.send(JSON.stringify({
            "type": "rCallReturn",
            "rIdx": callObj.rIdx,
            "return": ret
        }));
    }
    function _extractConstructorReferenceWName(objectName) {
        var obj = _callables[objectName].object;
        var objNameTab = objectName.split('.');
        for (var ct = 1; ct < objNameTab.length; ct++) {
            obj = obj[objNameTab[ct]];
            if (!obj) {
                throw {
                    "message": "Object " + objectName + " does not exist in callee ('" + objectName + "' called)",
                    "send": true
                };
            }
        }
        if (!obj) {
            throw {
                "message": "Object " + objectName + " does not exist in callee ('" + objectName + "' called)",
                "send": true
            };
        }
        return obj;
    }
    function _extractObjectReferenceWName(objectName, args, instanceId) {
        var obj;
        var context;
        var objNameTab = objectName.split('.');
        if (instanceId !== undefined && instanceId !== null) {
            obj = _instancesH[instanceId][objNameTab[0]];
            context = _instancesH[instanceId];
        }
        else {
            obj = _callables[objNameTab[0]].object;
            for (var ct = 1; ct < objNameTab.length; ct++) {
                obj = obj[objNameTab[ct]].object;
                if (!obj) {
                    throw {
                        "message": "Object " + objectName + " does not exist in callee ('" + objectName + "' called)",
                        "send": true
                    };
                }
            }
            context = this;
        }
        if (!obj || typeof obj !== 'function') {
            throw {
                "message": "Object " + objectName + " does not exist in callee ('" + objectName + "' called)",
                "send": true
            };
        }
        return function () { console.log('context', context); return obj.apply(context, args); };
    }
    function _generateError(code, message) {
        _debug_1._console.error('Generate error :', message);
        _ws.send(JSON.stringify({
            "type": "rError",
            "error": {
                "code": code,
                "message": message
            }
        }));
    }
});
//# sourceMappingURL=callee.js.map