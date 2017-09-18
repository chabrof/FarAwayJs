(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "chance", "../../secure_hash", "../../_debug"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Chance = require("chance");
    var secure_hash_1 = require("../../secure_hash");
    var _debug_1 = require("../../_debug");
    var SimpleStream = (function () {
        function SimpleStream() {
            var _this = this;
            this._magicToken = new Chance().guid();
            this._mySecureHash = secure_hash_1.generateSecureHash(this._magicToken, new Chance().guid());
            this._treat = {};
            this._callerSecureHashes = {};
            this._treat.farHandShake = (function (callObj) { return _this._treatFarHandShake(callObj); });
        }
        SimpleStream.prototype._treatFarHandShake = function (callObj) {
            var _this = this;
            _debug_1._console.log('SimpleStream : treat._farHandShake', callObj);
            _debug_1._console.assert(this._com, 'communication must be set before calling this function');
            if (!callObj.callerGUID) {
                throw {
                    "message": "callerGUID must be provided",
                    "callerSecureHash": null
                };
            }
            // CallerSecureHash is just a GUID, we generate callerSecureHash with it
            var callerSecureHash = secure_hash_1.generateSecureHash(this._magicToken, callObj.callerGUID);
            // Register client
            _debug_1._console.log("--> Generate secure hash for GUID (" + callObj.callerGUID + ")");
            _debug_1._console.log("    : " + callerSecureHash);
            this._callerSecureHashes[callerSecureHash] = true;
            this._com.registerCallerSecureHash(this._mySecureHash, callObj.callerGUID, callerSecureHash);
            // At this point, caller must provide its secureHash
            setTimeout(function () {
                _this._com.send(_this._mySecureHash, callerSecureHash, JSON.stringify({
                    "type": "farHandShakeReturn",
                    "callerSecureHash": callerSecureHash
                }));
            }, 0);
        };
        SimpleStream.prototype.setCommunication = function (communication) {
            var _this = this;
            this._com = communication;
            this._com.onMessage(this._mySecureHash, function (data) { return _this._messageCbk(data); });
        };
        SimpleStream.prototype._messageCbk = function (data) {
            _debug_1._console.log('Callee message handler...');
            var messageObj;
            try {
                messageObj = JSON.parse(data);
            }
            catch (e) {
                _debug_1._console.error("JSON parse error, message is not in the good format : " + data);
                return;
            }
            var secureHash;
            try {
                secureHash = this._treat[messageObj.type](messageObj);
            }
            catch (e) {
                _debug_1._console.error("Error (not sent) on treat of type(" + messageObj.type + ") : ", e);
            }
            return secureHash;
        };
        SimpleStream.prototype.sendData = function (data) {
            // We send data to all listening Callers
            this._com.send(this._mySecureHash, null, JSON.stringify(data));
        };
        SimpleStream.prototype.getBCInitDataForCaller = function () {
            return {
                constructorName: "SimpleStream",
                constructorArgs: [this._com.host, this._com.port, this._mySecureHash],
                initArgs: []
            };
        };
        return SimpleStream;
    }());
    exports.SimpleStream = SimpleStream;
});
//# sourceMappingURL=simple_stream.js.map