import { nullConsole } from "./console"

export let _console :any = nullConsole
export function debugOn(prConsole? :Console) {
  _console = prConsole ? prConsole : console;
}
