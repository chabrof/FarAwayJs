(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "ws", "./_debug"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ws_1 = require("ws");
    var _debug_1 = require("./_debug");
    var wss = new ws_1.Server({ port: 8080 });
    var wsTab = [];
    function sendToOthers(message, ws) {
        for (var ct = 0; ct < wsTab.length; ct++) {
            if (wsTab[ct] !== ws) {
                if (wsTab[ct].readyState === ws_1.OPEN) {
                    wsTab[ct].send(message);
                }
            }
        }
    }
    wss.on('connection', function connection(ws) {
        wsTab.push(ws);
        _debug_1._console.log('connection client', ws.readyState);
        ws.on('message', function incoming(message) {
            //_console.log('received: %s', message)
            sendToOthers(message, ws);
        });
    });
});
//# sourceMappingURL=pass_through.js.map