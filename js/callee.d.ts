import { FACalleeCommunication } from "./interfaces";
export declare let farAwayCallee: {
    debugOn: (prConsole?: Console) => void;
    setCommunication: (communication: FACalleeCommunication) => Promise<any>;
    regInstantiable: (object: any, excludeCalls: string[], objectName?: string) => void;
    regFunction: (func: any, funcName: any) => void;
};
