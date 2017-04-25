(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @class NullConsole
     * @impletments Console
     * This class implements all Browser Console methods
     */
    var NullConsole = (function () {
        function NullConsole(stdW, stdE) {
        }
        NullConsole.prototype.log = function () {
            return null;
        };
        NullConsole.prototype.debug = function () {
            return null;
        };
        NullConsole.prototype.info = function () {
            return null;
        };
        NullConsole.prototype.warn = function () {
            return null;
        };
        NullConsole.prototype.error = function () {
            return null;
        };
        NullConsole.prototype.group = function () {
            return null;
        };
        NullConsole.prototype.groupEnd = function () {
            return null;
        };
        NullConsole.prototype.assert = function () {
            return null;
        };
        NullConsole.prototype.clear = function () {
            return null;
        };
        NullConsole.prototype.count = function () {
            return null;
        };
        NullConsole.prototype.dir = function () {
            return null;
        };
        NullConsole.prototype.dirxml = function () {
            return null;
        };
        NullConsole.prototype.exception = function () {
            return null;
        };
        NullConsole.prototype.groupCollapsed = function () {
            return null;
        };
        NullConsole.prototype.time = function () {
            return null;
        };
        NullConsole.prototype.timeEnd = function () {
            return null;
        };
        NullConsole.prototype.trace = function () {
            return null;
        };
        NullConsole.prototype.msIsIndependentlyComposed = function () {
            return null;
        };
        NullConsole.prototype.profile = function () {
            return null;
        };
        NullConsole.prototype.profileEnd = function () {
            return null;
        };
        NullConsole.prototype.select = function () {
            return null;
        };
        NullConsole.prototype.table = function () {
            return null;
        };
        return NullConsole;
    }());
    exports.NullConsole = NullConsole;
    // Singleton
    exports.nullConsole = new NullConsole();
});
//# sourceMappingURL=console.js.map