import * as Chance from "chance";
import { generateSecureHash } from "../../secure_hash";
import { _console } from "../../_debug";
export class SimpleStream {
    constructor() {
        this._magicToken = new Chance.Chance().guid();
        this._mySecureHash = generateSecureHash(this._magicToken, new Chance.Chance().guid());
        this._treat = {};
        this._callerSecureHashes = {};
        this._treat.farHandShake = ((callObj) => this._treatFarHandShake(callObj));
    }
    _treatFarHandShake(callObj) {
        _console.log('SimpleStream : treat._farHandShake', callObj);
        _console.assert(this._com, 'communication must be set before calling this function');
        if (!callObj.callerGUID) {
            throw {
                "message": "callerGUID must be provided",
                "callerSecureHash": null
            };
        }
        // CallerSecureHash is just a GUID, we generate callerSecureHash with it
        let callerSecureHash = generateSecureHash(this._magicToken, callObj.callerGUID);
        // Register client
        _console.log(`--> Generate secure hash for GUID (${callObj.callerGUID})`);
        _console.log(`    : ${callerSecureHash}`);
        this._callerSecureHashes[callerSecureHash] = true;
        this._com.registerCallerSecureHash(this._mySecureHash, callObj.callerGUID, callerSecureHash);
        // At this point, caller must provide its secureHash
        setTimeout(() => {
            this._com.send(this._mySecureHash, callerSecureHash, JSON.stringify({
                "type": "farHandShakeReturn",
                "callerSecureHash": callerSecureHash
            }));
        }, 0);
    }
    setCommunication(communication) {
        this._com = communication;
        let info = communication.getInfo();
        _console.assert(info.host && info.port, "Host and port must be available in communication");
        this._hostForCaller = info.host;
        this._portForCaller = info.port;
        this._com.onMessage(this._mySecureHash, (data) => this._messageCbk(data));
    }
    _messageCbk(data) {
        _console.log('Callee message handler...');
        let messageObj;
        try {
            messageObj = JSON.parse(data);
        }
        catch (e) {
            _console.error(`JSON parse error, message is not in the good format : ${data}`);
            return;
        }
        let secureHash;
        try {
            secureHash = this._treat[messageObj.type](messageObj);
        }
        catch (e) {
            _console.error(`Error (not sent) on treat of type(${messageObj.type}) : `, e);
        }
        return secureHash;
    }
    sendData(data) {
        // We send data to all listening Callers
        this._com.send(this._mySecureHash, null, JSON.stringify(data));
    }
    getBCInitDataForCaller() {
        return {
            constructorName: "SimpleStream",
            constructorArgs: [this._hostForCaller, this._portForCaller, this._mySecureHash],
            initArgs: []
        };
    }
}
