import { FACallerCommunication, CallerBackCreate } from "./interfaces";
export declare let farAwayCaller: {
    debugOn: (prConsole?: Console) => void;
    setCommunication: (communication: FACallerCommunication) => Promise<any>;
    farCall: (name: string, args?: any[], instanceIdx?: number) => Promise<any>;
    farInstantiate: (name: string, instance: any, args?: any[]) => Promise<any>;
    farImport: (objNames: string[]) => any;
    regBackCreateObject: (name: string, backCreateObject: CallerBackCreate) => void;
};
