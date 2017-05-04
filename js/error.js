(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./_debug"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _debug_1 = require("./_debug");
    function generateError(communication, code, message) {
        console.error('Generate error :', message);
        _debug_1._console.assert(communication !== undefined && communication !== null, "communication must be a valid FACommunication instance");
        communication.send(JSON.stringify({
            "type": "farError",
            "error": {
                "code": code,
                "message": message
            }
        }));
    }
    exports.generateError = generateError;
});
//# sourceMappingURL=error.js.map