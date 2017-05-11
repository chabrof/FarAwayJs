export interface FASending {
    send: (srcSecureHash: string, message: string, destSecureHash?: string) => void;
}
export interface FACallerCommunication extends FASending {
    initListening: () => Promise<void>;
    onMessage: (handler: (data: string) => void) => void;
}
export interface FACalleeCommunication extends FASending {
    initListening: () => Promise<void>;
    onMessage: (secureHahsh: string, handler: (data: string) => void) => void;
    registerSecureHash: (GUID: string, secureHash: string) => void;
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
