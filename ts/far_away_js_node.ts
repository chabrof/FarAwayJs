import { farAwayCaller as caller } from "./caller"
import { farAwayCallee as callee } from "./callee"
import { CallerBackCreate, FACalleeCommunication, FACallerCommunication } from "./interfaces"
import { SimpleStream as CallerSimpleStream } from "./back_create/caller/simple_stream"
import { SimpleStream as CalleeSimpleStream } from "./back_create/callee/simple_stream"
import { WS as CallerWS } from "./communications/caller/ws"
import { WSS as CalleeWS } from "./communications/callee/wss"

export { caller, callee, CallerSimpleStream, CalleeSimpleStream, CallerWS, CalleeWS }
let FarAwayJs =  { caller, callee, CallerSimpleStream, CalleeSimpleStream, CallerWS, CalleeWS }

// define some global for Vanilla Js using only on browser side
if (typeof window !== 'undefined')
  (window as any).FarAwayJs = FarAwayJs
