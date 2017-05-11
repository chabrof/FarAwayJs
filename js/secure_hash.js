(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "jssha"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var jsSHA = require("jssha");
    function generateSecureHash(magicToken, clientGUID) {
        var shaObj = new jsSHA("SHA-256", "TEXT");
        shaObj.update(magicToken + clientGUID);
        var secureHash = shaObj.getHash("HEX");
        return secureHash;
    }
    exports.generateSecureHash = generateSecureHash;
});
//# sourceMappingURL=secure_hash.js.map