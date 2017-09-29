import { nullConsole } from "./console";
export let _console = nullConsole;
export function debugOn(prConsole) {
    _console = prConsole ? prConsole : console;
}
