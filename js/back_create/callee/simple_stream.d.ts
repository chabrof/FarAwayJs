import { CalleeBackCreate, CallerBCInitData, FACalleeCommunication } from "../../interfaces";
export declare class SimpleStream implements CalleeBackCreate {
    private _hostForCaller;
    private _portForCaller;
    private _com;
    private _magicToken;
    private _mySecureHash;
    constructor(hostForCaller?: string, portForCaller?: string);
    setCommunication(communication: FACalleeCommunication): void;
    private _messageCbk();
    sendData(data: any): void;
    getBCInitDataForCaller(): CallerBCInitData;
}
