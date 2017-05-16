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
        function SimpleStream(hostForCaller, portForCaller) {
            if (hostForCaller === void 0) { hostForCaller = "localhost"; }
            if (portForCaller === void 0) { portForCaller = "8081"; }
            this._magicToken = new Chance().guid();
            this._mySecureHash = secure_hash_1.generateSecureHash(this._magicToken, new Chance().guid());
            this._hostForCaller = hostForCaller;
            this._portForCaller = portForCaller;
        }
        SimpleStream.prototype.setCommunication = function (communication) {
            this._com = communication;
            this._com.onMessage(this._mySecureHash, this._messageCbk);
        };
        SimpleStream.prototype._messageCbk = function () {
            _debug_1._console.assert("This is a read only stream, there is no possible response by the client");
        };
        SimpleStream.prototype.sendData = function (data) {
            socket.send(JSON.stringify({ srcSecureHash: srcSecureHash, message: message }));
        };
        SimpleStream.prototype.getBCInitDataForCaller = function () {
            return {
                constructorName: "SimpleStream",
                constructorArgs: [this._hostForCaller, this._portForCaller],
                initArgs: []
            };
        };
        return SimpleStream;
    }());
    exports.SimpleStream = SimpleStream;
});
//# sourceMappingURL=simple_stream.js.map