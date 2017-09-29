/**
 * @class NullConsole
 * @extends Console
 * This class implements all Browser Console methods
 */
export class NullConsole {
    log() {
        return null;
    }
    debug() {
        return null;
    }
    info() {
        return null;
    }
    warn() {
        return null;
    }
    error() {
        return null;
    }
    group() {
        return null;
    }
    groupEnd() {
        return null;
    }
    assert() {
        return null;
    }
    clear() {
        return null;
    }
    count() {
        return null;
    }
    dir() {
        return null;
    }
    dirxml() {
        return null;
    }
    exception() {
        return null;
    }
    groupCollapsed() {
        return null;
    }
    time() {
        return null;
    }
    timeEnd() {
        return null;
    }
    trace() {
        return null;
    }
    msIsIndependentlyComposed() {
        return null;
    }
    profile() {
        return null;
    }
    profileEnd() {
        return null;
    }
    select() {
        return null;
    }
    table() {
        return null;
    }
}
// Singleton
export let nullConsole = new NullConsole();
