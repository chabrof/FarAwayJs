import { CallerBackCreate } from "../../interfaces";
export declare class SimpleStream implements CallerBackCreate {
    private _ws;
    private _host;
    private _port;
    private _listeners;
    private _listenersByType;
    private _treat;
    private _mySecureHash;
    private _handShakeOkPromise;
    private _myCallerGUID;
    private _calleeSecureHash;
    constructor(host: string, port: string, calleeSecureHash: string);
    init(): Promise<void>;
    private _farHandShake();
    private _treatFarHandShakeReturn(callObj);
    private _messageHandler(event);
    addEventListener: (cbk: (args: any) => any) => number;
    removeEventListener: (listenerIdx: any) => void;
}
