import { FACommunication } from "./interfaces";
export declare let setCommunication: (communication: FACommunication) => Promise<any>;
export declare function regInstantiable(object: any, excludeCalls: string[], objectName?: string): void;
export declare function regFunction(func: any, funcName: any): void;
