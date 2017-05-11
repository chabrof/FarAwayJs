(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./_debug", "./caller", "./callee", "./communication/caller/ws", "./communication/callee/wss"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("./_debug");
    var caller_1 = require("./caller");
    var callee_1 = require("./callee");
    var ws_1 = require("./communication/caller/ws");
    var wss_1 = require("./communication/callee/wss");
    exports.farAwayCaller = {
        debugOn: _debug_1.debugOn,
        setCommunication: caller_1.setCommunication,
        farCall: caller_1.farCall,
        farInstantiate: caller_1.farInstantiate,
        farImport: caller_1.farImport
    };
    exports.farAwayCallee = {
        debugOn: _debug_1.debugOn,
        setCommunication: callee_1.setCommunication,
        regInstantiable: callee_1.regInstantiable,
        regFunction: callee_1.regFunction
    };
    exports.communications = {
        caller: {
            WS: ws_1.WS
        },
        callee: {
            WSS: wss_1.WSS
            //WSServer
        }
    };
});
//# sourceMappingURL=communications.js.map