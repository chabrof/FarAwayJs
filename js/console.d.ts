/**
 * @class NullConsole
 * @extends Console
 * This class implements all Browser Console methods
 */
export declare class NullConsole {
    log(): void;
    debug(): void;
    info(): void;
    warn(): void;
    error(): void;
    group(): void;
    groupEnd(): void;
    assert(): void;
    clear(): void;
    count(): any;
    dir(): any;
    dirxml(): any;
    exception(): any;
    groupCollapsed(): any;
    time(): any;
    timeEnd(): any;
    trace(): any;
    msIsIndependentlyComposed(): any;
    profile(): any;
    profileEnd(): any;
    select(): any;
    table(): any;
}
export declare let nullConsole: NullConsole;
