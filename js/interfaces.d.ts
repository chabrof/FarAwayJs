export interface FASending {
    send: (calleeSecureHash: string, callerSecureHash: string, message: string) => void;
}
export interface FACallerCommunication extends FASending {
    initListening: () => Promise<void>;
    onMessage: (handler: (data: string) => void) => void;
    send: (calleeSecureHash: string, callerSecureHash: string, message: string) => void;
}
export interface FACalleeCommunication extends FASending {
    initListening: () => Promise<void>;
    getInfo: () => any;
    onMessage: (calleeSecureHash: string, handler: (data: string) => void, mainClient?: boolean) => void;
    registerCallerSecureHash: (calleeSecureHash: string, callerGUID: string, callerSecureHash: string) => void;
}
export interface TupleInstanceSecureHash {
    secureHash: string;
    instance: any;
}
export interface FAMessageObj {
    "callerSecureHash": string;
    "calleeSecureHash": string;
    "message": string;
}
export interface CallerBCInitData {
    "constructorName": string;
    "constructorArgs"?: any[];
    "initArgs"?: any[];
}
export interface CalleeBackCreate {
    getBCInitDataForCaller(): CallerBCInitData;
}
export interface CallerBackCreate {
    init(): Promise<any>;
}
