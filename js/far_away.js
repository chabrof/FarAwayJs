(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./_debug", "./caller", "./callee"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("./_debug");
    var caller_1 = require("./caller");
    var callee_1 = require("./callee");
    exports.farAwayCaller = {
        debugOn: _debug_1.debugOn,
        initWsListening: caller_1.initWsListening,
        farCall: caller_1.farCall,
        farInstantiate: caller_1.farInstantiate,
        farImport: caller_1.farImport
    };
    exports.farAwayCallee = {
        debugOn: _debug_1.debugOn,
        usePassThroughWsServer: callee_1.usePassThroughWsServer,
        regInstantiable: callee_1.regInstantiable,
        regFunction: callee_1.regFunction
    };
});
//# sourceMappingURL=far_away.js.map