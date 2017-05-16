export interface FASending {
    send: (srcSecureHash: string, message: string, destSecureHash?: string) => void;
}
export interface FACallerCommunication extends FASending {
    initListening: () => Promise<void>;
    onMessage: (handler: (data: string) => void) => void;
}
export interface FACalleeCommunication extends FASending {
    initListening: () => Promise<void>;
    onMessage: (calleeSecureHash: string, handler: (data: string) => void) => void;
    registerCallerSecureHash: (calleeSecureHash: string, callerGUID: string, callerSecureHash: string) => void;
}
export interface TupleInstanceSecureHash {
    secureHash: string;
    instance: any;
}
export interface FAMessageObj {
    "srcSecureHash": string;
    "dstSecureHash": string;
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
