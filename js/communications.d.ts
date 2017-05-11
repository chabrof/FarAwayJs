export declare let farAwayCaller: {
    debugOn: (prConsole?: Console) => void;
    setCommunication: any;
    farCall: any;
    farInstantiate: any;
    farImport: any;
};
export declare let farAwayCallee: {
    debugOn: (prConsole?: Console) => void;
    setCommunication: any;
    regInstantiable: any;
    regFunction: any;
};
export declare let communications: {
    caller: {
        WS: any;
    };
    callee: {
        WSS: any;
    };
};
