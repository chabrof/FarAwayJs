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
    function _generateError(code, message) {
        console.error('Generate error :', message);
        this._ws.send(JSON.stringify({
            "type": "rError",
            "error": {
                "code": code,
                "message": message
            }
        }));
    }
    exports._generateError = _generateError;
});
//# sourceMappingURL=_error.js.map