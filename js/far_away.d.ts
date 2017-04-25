export declare let farAwayCaller: {
    debugOn: (prConsole?: Console) => void;
    initWsListening: (url?: string, port?: string) => void;
    farCall: (objectName: string, args?: any[], instanceIdx?: number) => Promise<any>;
    farInstantiate: (constructorName: string, args?: any[]) => Promise<any>;
    farImport: (objNames: string[]) => any;
};
export declare let farAwayCallee: {
    debugOn: (prConsole?: Console) => void;
    usePassThroughWsServer: (url?: string, port?: string) => void;
    regInstantiable: (object: any, excludeCalls: string[], objectName?: string) => void;
    regFunction: (func: any, funcName: any) => void;
};
