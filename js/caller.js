(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./_debug", "jssha"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("./_debug");
    var jsSHA = require("jssha");
    var _callables = {};
    var _rCallIdx = 0;
    var _promiseOkCbksH = {};
    var _wsServer = "ws://localhost:8080";
    var _ws, _wsReadyPromise;
    var _declareWsReady;
    var _importedInstiables = {};
    var _treat = {};
    _treat.rError = function (errorObj) {
        _debug_1._console.error("Error on simpleRpc", errorObj.error);
    };
    _treat.rCallReturn = function (callObj) {
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
    _treat.rInstantiateReturn = function (callObj) {
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
    _treat.rImportReturn = function (callObj) {
        _debug_1._console.log('treat.rImportReturn', callObj);
        if (typeof callObj.rIdx !== "number") {
            throw {
                "message": "rIdx is empty or invalid : " + callObj.rCallrIdx,
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
    function initWsListening(url, port) {
        if (url === void 0) { url = "localhost"; }
        if (port === void 0) { port = "8080"; }
        _debug_1._console.assert(_ws === undefined, "You have already init the WebSocket listening");
        _ws = new WebSocket(_wsServer);
        _wsReadyPromise = new Promise(function (ok, ko) { _declareWsReady = ok; });
        _ws.addEventListener('open', function () { _declareWsReady(); });
        _ws.addEventListener('message', function (message) {
            var messageObj;
            try {
                messageObj = JSON.parse(message.data);
            }
            catch (e) {
                _debug_1._console.log('Exception', e);
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
                    console.error('Error : ', e.message);
                }
            }
        });
    }
    exports.initWsListening = initWsListening;
    function _generateError(code, message) {
        console.error('Generate error :', message);
        _ws.send(JSON.stringify({
            "type": "rError",
            "error": {
                "code": code,
                "message": message
            }
        }));
    }
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
        _debug_1._console.assert(_wsReadyPromise, 'Init seems not to be done yet, you must call initWsListening before such operation');
        if (typeof objectName !== "string" || !objectName.length) {
            throw {
                "message": "Method is empty or invalid : " + objectName,
                "send": false
            };
        }
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
    exports.farCall = farCall;
    function farImport(objNames) {
        _debug_1._console.log('farImport : ', objNames);
        var idx = _getRCallIdx();
        var promise = new Promise(function (ok, ko) { _promiseOkCbksH[idx] = ok; });
        _wsReadyPromise.then(function () {
            _ws.send(JSON.stringify({
                "type": "rImport",
                "rIdx": idx,
                "symbols": objNames
            }));
        });
        return promise;
    }
    exports.farImport = farImport;
    function farInstantiate(constructorName, args) {
        if (args === void 0) { args = []; }
        _debug_1._console.log('farInstantiate : ', constructorName);
        var idx = _getRCallIdx();
        var promise = new Promise(function (ok, ko) { _promiseOkCbksH[idx] = ok; });
        _wsReadyPromise.then(function () {
            _ws.send(JSON.stringify({
                "type": "rInstantiate",
                "constructorName": constructorName,
                "rIdx": idx,
                "guid": _generateGuid(),
                "args": args
            }));
        });
        return promise;
    }
    exports.farInstantiate = farInstantiate;
    function _generateGuid() {
        var shaObj = new jsSHA("SHA-256", "TEXT");
        shaObj.update("This is a ");
        shaObj.update("test");
        return shaObj.getHash("HEX");
    }
});
//# sourceMappingURL=caller.js.map