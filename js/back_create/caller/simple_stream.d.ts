import { CallerBackCreate } from "../../interfaces";
export declare class SimpleStream implements CallerBackCreate {
    private _ws;
    private _host;
    private _port;
    private _listeners;
    private _listenersByType;
    constructor(host?: string, port?: string, options?: any);
    init(): Promise<void>;
    private _messageHandler(event);
    addEventListener: (cbk: (args: any) => any) => number;
    removeEventListener: (listenerIdx: any) => void;
}
