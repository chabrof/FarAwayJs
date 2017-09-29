import { FACalleeCommunication } from "../../interfaces";
export declare class WSS implements FACalleeCommunication {
    private _wss;
    private _calleeMessageHandlers;
    private _mainCalleeSecureHash;
    private _host;
    private _port;
    private _wsTab;
    private _callersWSInfo;
    constructor(host?: string, port?: string, options?: any);
    readonly host: string;
    readonly port: string;
    onMessage(calleeSecureHash: string, handler: (data: string) => string, mainClient?: boolean): void;
    initListening(): Promise<void>;
    private _treatIncomingMessage(ws, message);
    registerCallerSecureHash(calleeSecureHash: string, callerGUID: string, callerSecureHash: string): void;
    send(calleeSecureHash: string, callerSecureHash: string, message: string): void;
    private _send(calleeSecureHash, socket, message);
}
