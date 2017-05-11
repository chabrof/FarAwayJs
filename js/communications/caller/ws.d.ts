import { FACallerCommunication } from "../../interfaces";
export declare class WS implements FACallerCommunication {
    private _ws;
    private _clientMessageHandler;
    private _host;
    private _port;
    constructor(host?: string, port?: string, options?: any);
    onMessage(handler: (data: string) => string): void;
    private _messageHandler(event);
    initListening(): Promise<void>;
    send(srcSecureHash: string, message: string, destSecureHash?: string): void;
}
