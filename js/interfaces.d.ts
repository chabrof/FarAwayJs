export interface FACommunication {
    initListening: () => Promise<void>;
    onMessage: (handler: (data: string) => void) => void;
    send: (srcSecureHash: string, destSecureHash: string, message: string, destGUID?: string) => void;
}
export interface TupleInstanceSecureHash {
    secureHash: string;
    instance: any;
}
export interface FAMessageObj {
    "srcSecureHash"?: string;
    "dstSecureHash"?: string;
    "dstGUID"?: string;
    "message": string;
}
