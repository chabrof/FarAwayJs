(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./_debug", "./_debug", "./error", "chance", "./secure_hash"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("./_debug");
    var _debug_2 = require("./_debug");
    var error_1 = require("./error");
    var Chance = require("chance");
    var secure_hash_1 = require("./secure_hash");
    var _callables = {};
    var _rCallIdx = 0;
    var _com, _comReadyPromise;
    var _instancesH = {};
    var _magicToken = new Chance().guid();
    var _secureHashes = {};
    var _mySecureHash = secure_hash_1.generateSecureHash(_magicToken, new Chance().guid());
    var setCommunication = function (communication) {
        _com = communication;
        _com.onMessage(_mySecureHash, _messageCbk);
        _comReadyPromise = _com.initListening();
        return _comReadyPromise;
    };
    var _messageCbk = function (data) {
        var messageObj;
        try {
            messageObj = JSON.parse(data);
        }
        catch (e) {
            _debug_1._console.error("JSON parse error, message is not in the good format :" + data);
            return;
        }
        var secureHash;
        try {
            secureHash = _treat[messageObj.type](messageObj);
        }
        catch (e) {
            if (e.send && e.secureHash) {
                error_1.generateError(_mySecureHash, _com, 1, e.message, e.secureHash);
            }
            else {
                _debug_1._console.error("Error on treat of type(" + messageObj.type + ") : ", e.message, e.stack);
            }
        }
        return secureHash;
    };
    function regInstantiable(object, excludeCalls, objectName) {
        if (objectName === void 0) { objectName = undefined; }
        _debug_1._console.assert(typeof object === 'function' && object, 'Entity must be a not null function (' + object + ' given)');
        _callables[objectName ? objectName : object.name] = new CallableObject(object, "instantiable", excludeCalls);
    }
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
    var _checkSecureHash = function (secureHash, instanceIdx) {
        if (_secureHashes[secureHash] === undefined) {
            error_1.generateError(_mySecureHash, _com, 4, 'The client seems not to be registered, it must call farImport before further operation and then pass secureHash on each request', secureHash);
            return false;
        }
        if (instanceIdx !== undefined && _instancesH[instanceIdx].secureHash !== secureHash) {
            error_1.generateError(_mySecureHash, _com, 4, 'The client is not allowed to access this ressource', secureHash);
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
        var Constructor = _extractConstructorReferenceWName(constructorObj);
        try {
            constructorObj.args.unshift(null);
            var instance = new (Function.prototype.bind.apply(Constructor, constructorObj.args));
            _instancesH[constructorObj.rIdx] = { "instance": instance, "secureHash": constructorObj.secureHash };
        }
        catch (e) {
            throw constructorObj.constructorName + "seems not to be a valid constructor";
        }
        _com.send(_mySecureHash, constructorObj.secureHash, JSON.stringify({
            "type": "farInstantiateReturn",
            "rIdx": constructorObj.rIdx
        }));
        return constructorObj.secureHash;
    };
    _treat.farCall = function (callObj) {
        _debug_1._console.log('treat.farCall', callObj);
        _debug_1._console.assert(_com, 'communication must be set before calling this function');
        if (!_checkSecureHash(callObj.secureHash, callObj.instanceIdx))
            return; // -->
        if (typeof callObj.objectName !== "string" || !callObj.objectName.length) {
            throw {
                "message": "objectName is empty or invalid : " + callObj.objectName,
                "send": true,
                "secureHash": callObj.srcSecureHash
            };
        }
        var obj = _extractObjectReferenceWName(callObj);
        var ret = obj();
        if (ret instanceof Promise) {
            ret
                .then(function (ret) { _sendFarCallReturn(callObj.secureHash, callObj, ret); })
                .catch(function (error) { error_1.generateError(_mySecureHash, _com, 10, error, callObj.srcSecureHash); });
        }
        else {
            _sendFarCallReturn(callObj.secureHash, callObj, ret);
        }
    };
    _treat.farImport = function (callObj) {
        _debug_1._console.assert(_com, 'communication must be set before calling this function');
        if (typeof callObj.symbols !== "object" || !callObj.symbols.length) {
            throw {
                "message": "List of symbols is empty or invalid : " + callObj.symbols,
                "send": true,
                "secureHash": callObj.srcSecureHash
            };
        }
        if (!callObj.GUID) {
            throw {
                "message": "GUID must be provided",
                "send": true,
                "secureHash": null
            };
        }
        var result = [];
        callObj.symbols.forEach(function (symbol) {
            if (!_callables[symbol]) {
                throw {
                    "message": "Symbol '" + symbol + "' does not exist in callee",
                    "send": true,
                    "secureHash": callObj.GUID
                };
            }
            result.push(_callables[symbol]);
        });
        // srcSecureHash is just a GUID, we generate secureHash with it
        var destSecureHash = secure_hash_1.generateSecureHash(_magicToken, callObj.GUID);
        // register client
        _secureHashes[destSecureHash] = true;
        _com.registerSecureHash(callObj.GUID, destSecureHash);
        // At this point, caller must provide its secureHash
        setTimeout(function () {
            _com.send(_mySecureHash, destSecureHash, JSON.stringify({
                "type": "farImportReturn",
                "rIdx": callObj.rIdx,
                "secureHash": destSecureHash,
                "objects": result
            }));
        }, 0);
    };
    function _sendFarCallReturn(secureHash, callObj, ret) {
        _debug_1._console.log('_sendFarCallReturn', ret);
        _com.send(_mySecureHash, secureHash, JSON.stringify({
            "type": "farCallReturn",
            "rIdx": callObj.rIdx,
            "return": ret
        }));
    }
    function _extractConstructorReferenceWName(callObj) {
        _debug_1._console.log('_extractConstructorReferenceWName', callObj);
        var obj = _callables[callObj.constructorName].object;
        var objNameTab = callObj.constructorName.split('.');
        for (var ct = 1; ct < objNameTab.length; ct++) {
            obj = obj[objNameTab[ct]];
            if (!obj) {
                throw {
                    "message": "Object " + callObj.constructorName + " does not exist in callee ('" + callObj.constructorName + "' called)",
                    "send": true,
                    "secureHash": callObj.srcSecureHash
                };
            }
        }
        if (!obj) {
            throw {
                "message": "Object " + callObj.constructorName + " does not exist in callee ('" + callObj.constructorName + "' called)",
                "send": true,
                "secureHash": callObj.srcSecureHash
            };
        }
        return obj;
    }
    function _extractObjectReferenceWName(callObj) {
        _debug_1._console.log('_extractConstructorReferenceWName', callObj);
        var obj;
        var context;
        var objNameTab = callObj.objectName.split('.');
        if (callObj.instanceIdx !== undefined && callObj.instanceIdx !== null) {
            context = _instancesH[callObj.instanceIdx].instance;
            obj = context[objNameTab[0]];
        }
        else {
            obj = _callables[objNameTab[0]].object;
            for (var ct = 1; ct < objNameTab.length; ct++) {
                obj = obj[objNameTab[ct]].object;
                if (!obj) {
                    throw {
                        "message": "Object " + callObj.objectName + " does not exist in callee ('" + callObj.objectName + "' called)",
                        "send": true,
                        "secureHash": callObj.srcSecureHash
                    };
                }
            }
            context = this;
        }
        if (!obj || typeof obj !== 'function') {
            throw {
                "message": "Object " + callObj.objectName + ' does not exist ' + (callObj.instanceId ? "(in instance) " : "") + "in callee ('" + callObj.objectName + "' called)",
                "send": true,
                "secureHash": callObj.srcSecureHash
            };
        }
        return function () { console.log('context', context); return obj.apply(context, callObj.args); };
    }
    exports.farAwayCallee = {
        debugOn: _debug_2.debugOn,
        setCommunication: setCommunication,
        regInstantiable: regInstantiable,
        regFunction: regFunction
    };
});
//# sourceMappingURL=callee.js.map