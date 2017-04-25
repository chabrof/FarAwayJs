import { debugOn } from "./_debug"
import { initWsListening, farCall, farInstantiate, farImport } from "./caller"
import { usePassThroughWsServer, regInstantiable, regFunction } from "./callee"

export let farAwayCaller = {
  debugOn :debugOn,
  initWsListening : initWsListening,
  farCall :farCall,
  farInstantiate :farInstantiate,
  farImport :farImport
}

export let farAwayCallee = {
  debugOn :debugOn,
  usePassThroughWsServer : usePassThroughWsServer,
  regInstantiable : regInstantiable,
  regFunction : regFunction
}
