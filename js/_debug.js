(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./console"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var console_1 = require("./console");
    exports._console = console_1.nullConsole;
    function debugOn(prConsole) {
        exports._console = prConsole ? prConsole : console;
    }
    exports.debugOn = debugOn;
});
//# sourceMappingURL=_debug.js.map