(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./_debug", "./error", "jssha", "chance"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("./_debug");
    var error_1 = require("./error");
    var jsSHA = require("jssha");
    var Chance = require("chance");
    var _callables = {};
    var _rCallIdx = 0;
    var _com, _comReadyPromise;
    var _instancesH = {};
    var _magicToken = new Chance().guid();
    var _secureHashes = {};
    exports.setCommunication = function (communication) {
        _com = communication;
        _com.onMessage(_messageCbk);
        _comReadyPromise = _com.initListening();
        return _comReadyPromise;
    };
    var _messageCbk = function (event) {
        var messageObj;
        try {
            messageObj = JSON.parse(event.data);
        }
        catch (e) {
            error_1.generateError(_com, 3, "Message is not in the good format");
        }
        try {
            _treat[messageObj.type](messageObj);
        }
        catch (e) {
            if (e.send) {
                error_1.generateError(_com, 1, e.message);
            }
            else {
                _debug_1._console.error('Error : ', e.message, e.stack);
            }
        }
    };
    function _generateSecureHash(clientGUID) {
        var shaObj = new jsSHA("SHA-256", "TEXT");
        shaObj.update(_magicToken + clientGUID);
        var secureHash = shaObj.getHash("HEX");
        _secureHashes[secureHash] = true;
        return secureHash;
    }
    function regInstantiable(object, excludeCalls, objectName) {
        if (objectName === void 0) { objectName = undefined; }
        _debug_1._console.assert(typeof object === 'function' && object, 'Entity must be a not null function (' + object + ' given)');
        _callables[objectName ? objectName : object.name] = new CallableObject(object, "instantiable", excludeCalls);
    }
    exports.regInstantiable = regInstantiable;
    var CallableObject = (function () {
        function CallableObject(object, type, excludeCalls) {
            if (excludeCalls === void 0) { excludeCalls = []; }
            this.structure = {};
            this.type = type;
            this.object = object;
            this._excludeCalls = excludeCalls;
            this.structure = this._exploreObject(this.object);
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
    var _checkSecureHash = function (secureHash, instanceIdx) {
        if (_secureHashes[secureHash] === undefined) {
            error_1.generateError(_com, 4, 'The client seems not to be registered, it must call farImport before further operation and then pass secureHash on each request');
            return false;
        }
        if (instanceIdx !== undefined && _instancesH[instanceIdx].secureHash !== secureHash) {
            error_1.generateError(_com, 4, 'The client is not allowed to access this ressource');
            return false;
        }
        return true;
    };
    var _treat = {};
    _treat.farInstantiate = function (constructorObj) {
        _debug_1._console.log('treat.farInstantiate', constructorObj);
        _debug_1._console.assert(_com, 'communication must be set before calling this function');
        if (!_checkSecureHash(constructorObj.secureHash))
            return; // -->
        var Constructor = _extractConstructorReferenceWName(constructorObj.constructorName);
        try {
            constructorObj.args.unshift(null);
            var instance = new (Function.prototype.bind.apply(Constructor, constructorObj.args));
            _instancesH[constructorObj.rIdx] = { "instance": instance, "secureHash": constructorObj.secureHash };
        }
        catch (e) {
            throw constructorObj.constructorName + "seems not to be a valid constructor";
        }
        _com.send(JSON.stringify({
            "type": "farInstantiateReturn",
            "rIdx": constructorObj.rIdx
        }));
    };
    _treat.farCall = function (callObj) {
        _debug_1._console.log('treat.farCall', callObj);
        _debug_1._console.assert(_com, 'communication must be set before calling this function');
        if (!_checkSecureHash(callObj.secureHash, callObj.instanceIdx))
            return; // -->
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
                .then(function (ret) { _sendFarCallReturn(callObj, ret); })
                .catch(function (error) { error_1.generateError(_com, 10, error); });
        }
        else {
            _sendFarCallReturn(callObj, ret);
        }
    };
    _treat.farImport = function (callObj) {
        _debug_1._console.assert(_com, 'communication must be set before calling this function');
        if (typeof callObj.symbols !== "object" || !callObj.symbols.length) {
            throw {
                "message": "List of symbols is empty or invalid : " + callObj.symbols,
                "send": true
            };
        }
        var result = [];
        callObj.symbols.forEach(function (symbol) {
            if (!_callables[symbol]) {
                throw {
                    "message": "Symbol '" + symbol + "' does not exist in callee",
                    "send": true
                };
            }
            result.push(_callables[symbol]);
        });
        _com.send(JSON.stringify({
            "type": "farImportReturn",
            "rIdx": callObj.rIdx,
            "secureHash": _generateSecureHash(callObj.GUID),
            "objects": result
        }));
    };
    function _sendFarCallReturn(callObj, ret) {
        _debug_1._console.log('_sendFarCallReturn', ret);
        _com.send(JSON.stringify({
            "type": "farCallReturn",
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
            context = _instancesH[instanceId].instance;
            obj = context[objNameTab[0]];
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
                "message": "Object " + objectName + ' does not exist ' + (instanceId ? "(in instance) " : "") + "in callee ('" + objectName + "' called)",
                "send": true
            };
        }
        return function () { console.log('context', context); return obj.apply(context, args); };
    }
});
//# sourceMappingURL=callee.js.map