import { debugOn } from "./_debug"
import { setCommunication as setCommunicationClr, farCall, farInstantiate, farImport } from "./caller"
import { setCommunication as setCommunicationClee, regInstantiable, regFunction } from "./callee"
import { FACommunication } from "./interfaces"
import { WS } from "./communication/caller/ws"
import { WSPassThrough } from "./communication/callee/ws_pass_through"

export let farAwayCaller = {
  debugOn :debugOn,
  setCommunication : setCommunicationClr,
  farCall :farCall,
  farInstantiate :farInstantiate,
  farImport :farImport
}

export let farAwayCallee = {
  debugOn :debugOn,
  setCommunication : setCommunicationClee,
  regInstantiable : regInstantiable,
  regFunction : regFunction
}

export let communications = {
  caller : {
    WS : WS
  },
  callee : {
    WSPassThrough : WSPassThrough
    //WSServer
  }
}
