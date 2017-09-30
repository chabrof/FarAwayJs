import { _console } from "./_debug";
export function generateError(srcSecureHash, communication, code, message, destSecureHash, debugObj) {
    console.error('Generate error :', message);
    if (debugObj !== undefined)
        console.error('DebugObj', debugObj);
    _console.assert(communication !== undefined && communication !== null, "communication must be a valid FACommunication instance");
    communication.send(srcSecureHash, destSecureHash, JSON.stringify({
        "type": "farError",
        "error": {
            "code": code,
            "message": message
        }
    }));
}
