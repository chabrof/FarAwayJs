import { _console } from "./_debug";
export function generateError(srcSecureHash, communication, code, message, destSecureHash) {
    console.error('Generate error :', message);
    _console.assert(communication !== undefined && communication !== null, "communication must be a valid FACommunication instance");
    communication.send(srcSecureHash, destSecureHash, JSON.stringify({
        "type": "farError",
        "error": {
            "code": code,
            "message": message
        }
    }));
}
