import { FACalleeCommunication } from "../../interfaces";
export declare class WSS implements FACalleeCommunication {
    private _wss;
    private _clientMessageHandlers;
    private _mainClientHandler;
    private _host;
    private _port;
    private _wsTab;
    private _GUIDToSocket;
    private _secureHashToSocket;
    private _secureHashToGUID;
    constructor(host?: string, port?: string, options?: any);
    onMessage(secureHash: string, handler: (data: string) => string, mainClient?: boolean): void;
    initListening(): Promise<void>;
    private _treatIncomingMessage(ws, message);
    registerSecureHash(GUID: string, secureHash: string): void;
    send(srcSecureHash: string, destSecureHash: string, message: string): void;
}
