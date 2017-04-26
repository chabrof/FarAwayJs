(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./_debug", "./error", "chance"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("./_debug");
    var error_1 = require("./error");
    var Chance = require("chance");
    var _callables = {};
    var _rCallIdx = 0;
    var _promiseOkCbksH = {};
    var _com, _comReadyPromise;
    var _importedInstiables = {};
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
            _debug_1._console.log('Exception', e);
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
                console.error('Error : ', e.message, e.stack);
            }
        }
    };
    var _treat = {};
    _treat.farError = function (errorObj) {
        _debug_1._console.error("Error on simpleRpc", errorObj.error);
    };
    _treat.farCallReturn = function (callObj) {
        _debug_1._console.log('treat_rCallReturn', callObj, _promiseOkCbksH);
        if (typeof callObj.rIdx !== "number") {
            throw {
                "message": "rIdx is empty or invalid : " + callObj.rCallrIdx,
                "send": false
            };
        }
        var ret = callObj.return;
        _debug_1._console.log('ici', typeof _promiseOkCbksH[callObj.rIdx]);
        _promiseOkCbksH[callObj.rIdx](ret); // complete the associated Promise
    };
    _treat.farInstantiateReturn = function (callObj) {
        _debug_1._console.log('treat_rInstantiateReturn', callObj);
        if (typeof callObj.rIdx !== "number") {
            throw {
                "message": "rIdx is empty or invalid : " + callObj.rCallrIdx,
                "send": false
            };
        }
        var instanceRpc = new FarAwayCallerInstance(callObj.rIdx);
        _promiseOkCbksH[callObj.rIdx](instanceRpc); // complete the associated Promise
    };
    _treat.farImportReturn = function (callObj) {
        _debug_1._console.log('treat.rImportReturn', callObj);
        if (typeof callObj.rIdx !== "number") {
            throw {
                "message": "rIdx is empty or invalid : " + callObj.rCallrIdx,
                "send": false
            };
        }
        _secureHash = callObj.secureHash;
        if (!_secureHash) {
            throw {
                "message": "_secureHash is empty or invalid in response",
                "send": false
            };
        }
        var wrapObjects = _createWrappingObjects(callObj.objects);
        _promiseOkCbksH[callObj.rIdx].apply(this, wrapObjects); // complete the associated Promise
    };
    function _createWrappingObjects(objDescriptions) {
        var wrappingObjects = [];
        objDescriptions.forEach(function (objDescription) {
            _wrappingObjFactory[objDescription.type](objDescription);
        });
        return wrappingObjects;
    }
    var _wrappingObjFactory = {};
    _wrappingObjFactory['function'] = function (objDescription) {
        var func = function () {
            return farCall(objDescription.name);
        };
    };
    _wrappingObjFactory['instantiable'] = function (objDescription) {
        var factory = {};
        factory[objDescription] = {};
        /*
        for (let i in objDescription.structure) {
          if (i !== "__prototype__") {
            if (objDescription[i] === "function") {
              //factory[objDescription.name][i] = function
            }
          }
        }*/
        var remotePrototype = objDescription.structure.__prototype__;
        var _loop_1 = function (i) {
            factory[i] =
                function (instanceIdx) {
                    if (instanceIdx === void 0) { instanceIdx = undefined; }
                    return farCall(objDescription.name + '.' + remotePrototype[i], [], instanceIdx);
                };
        };
        for (var i in remotePrototype) {
            _loop_1(i);
        }
    };
    var FarAwayCallerInstance = (function () {
        function FarAwayCallerInstance(instanceIdx) {
            this.__farAwayInstIdx__ = instanceIdx;
        }
        FarAwayCallerInstance.prototype.farCall = function (objectName, args) {
            return farCall(objectName, args, this.__farAwayInstIdx__);
        };
        return FarAwayCallerInstance;
    }());
    function _getRCallIdx() {
        return _rCallIdx++;
    }
    function _extractArgs(argsIn) {
        var argsOut = [];
        for (var ct = 1; ct < argsIn.length; ct++) {
            argsOut.push(argsIn[ct]);
        }
        return argsOut;
    }
    function farCall(objectName, args, instanceIdx) {
        if (args === void 0) { args = []; }
        if (instanceIdx === void 0) { instanceIdx = undefined; }
        _debug_1._console.log('farCall : ', objectName, args);
        _debug_1._console.assert(_comReadyPromise, 'Init seems not to be done yet, you must call initWsListening before such operation');
        _debug_1._console.assert(_secureHash, 'secureHash is not defined, you must call farImport and wait for its response (promise) before calling this method');
        if (typeof objectName !== "string" || !objectName.length) {
            throw {
                "message": "Method is empty or invalid : " + objectName,
                "send": false
            };
        }
        var idx = _getRCallIdx();
        var promise = new Promise(function (ok, ko) { _promiseOkCbksH[idx] = ok; });
        _comReadyPromise.then(function () {
            _com.send(JSON.stringify({
                "type": "farCall",
                "objectName": objectName,
                "args": args,
                "instanceIdx": instanceIdx,
                "rIdx": idx,
                "secureHash": _secureHash
            }));
        });
        return promise;
    }
    exports.farCall = farCall;
    // unique guid for caller instance
    var _guid;
    var _secureHash;
    function farImport(objNames) {
        _debug_1._console.log('farImport : ', objNames);
        var idx = _getRCallIdx();
        var promise = new Promise(function (ok, ko) { _promiseOkCbksH[idx] = ok; });
        var chance = new Chance();
        _guid = chance.guid();
        _comReadyPromise.then(function () {
            _com.send(JSON.stringify({
                "type": "farImport",
                "rIdx": idx,
                "guid": _guid,
                "symbols": objNames
            }));
        });
        return promise;
    }
    exports.farImport = farImport;
    function farInstantiate(constructorName, args) {
        if (args === void 0) { args = []; }
        _debug_1._console.log('farInstantiate : ', constructorName);
        _debug_1._console.assert(_secureHash, 'secureHash is not defined, you must call farImport and wait for its response (promise) before calling this method');
        var idx = _getRCallIdx();
        var promise = new Promise(function (ok, ko) { _promiseOkCbksH[idx] = ok; });
        _comReadyPromise.then(function () {
            _com.send(JSON.stringify({
                "type": "farInstantiate",
                "constructorName": constructorName,
                "rIdx": idx,
                "GUID": _guid,
                "args": args,
                "secureHash": _secureHash
            }));
        });
        return promise;
    }
    exports.farInstantiate = farInstantiate;
});
//# sourceMappingURL=caller.js.map