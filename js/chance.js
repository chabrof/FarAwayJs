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
    var Chance = (function () {
        function Chance() {
        }
        Chance.prototype.guid = function () { return null; };
        return Chance;
    }());
    exports.default = Chance;
});
//# sourceMappingURL=chance.js.map