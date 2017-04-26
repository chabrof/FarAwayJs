import { FACommunication } from "./interfaces";
import { WS } from "./communication/caller/ws";
export declare let farAwayCaller: {
    debugOn: (prConsole?: Console) => void;
    setCommunication: (communication: FACommunication) => Promise<any>;
    farCall: (objectName: string, args?: any[], instanceIdx?: number) => Promise<any>;
    farInstantiate: (constructorName: string, args?: any[]) => Promise<any>;
    farImport: (objNames: string[]) => any;
};
export declare let farAwayCallee: {
    debugOn: (prConsole?: Console) => void;
    setCommunication: (communication: FACommunication) => Promise<any>;
    regInstantiable: (object: any, excludeCalls: string[], objectName?: string) => void;
    regFunction: (func: any, funcName: any) => void;
};
export declare let communications: {
    caller: {
        WS: typeof WS;
    };
    callee: {
        WSPassThrough: typeof WS;
    };
};
