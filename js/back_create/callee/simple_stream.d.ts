import { CalleeBackCreate, CallerBCInitData, FACalleeCommunication } from "../../interfaces";
export declare class SimpleStream implements CalleeBackCreate {
    private _hostForCaller;
    private _portForCaller;
    private _com;
    private _magicToken;
    private _mySecureHash;
    private _treat;
    private _callerSecureHashes;
    constructor(hostForCaller?: string, portForCaller?: string);
    private _treatFarHandShake(callObj);
    setCommunication(communication: FACalleeCommunication): void;
    private _messageCbk(data);
    sendData(data: any): void;
    getBCInitDataForCaller(): CallerBCInitData;
}
