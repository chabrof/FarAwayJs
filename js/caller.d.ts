export declare function initWsListening(url?: string, port?: string): void;
export declare function farCall(objectName: string, args?: any[], instanceIdx?: number): Promise<any>;
export declare function farImport(objNames: string[]): any;
export declare function farInstantiate(constructorName: string, args?: any[]): Promise<any>;
