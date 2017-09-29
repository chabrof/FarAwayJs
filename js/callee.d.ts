import { FACalleeCommunication } from "./interfaces";
export declare class CallableObject {
    name: string;
    structure: any;
    object: any;
    type: string;
    private _excludeCalls;
    constructor(name: string, object: any, type: string, excludeCalls?: string[]);
    _exploreObject(object: any): {
        __prototype__: {};
    };
}
export declare let farAwayCallee: {
    debugOn: (prConsole?: Console) => void;
    setCommunication: (communication: FACalleeCommunication) => Promise<any>;
    register: (object: any, name?: string, excludeCalls?: string[]) => void;
};
