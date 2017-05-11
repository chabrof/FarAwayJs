"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var console_1 = require("./console");
exports._console = console_1.nullConsole;
function debugOn(prConsole) {
    exports._console = prConsole ? prConsole : console;
}
exports.debugOn = debugOn;
