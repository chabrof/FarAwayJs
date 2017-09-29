import { farAwayCallee as callee } from "./callee"
import { CallerBackCreate, FACalleeCommunication, FACallerCommunication } from "./interfaces"
import { SimpleStream as CalleeSimpleStream } from "./back_create/callee/simple_stream"
import { WSS as CalleeWS } from "./communications/callee/wss"

export { callee, CalleeSimpleStream, CalleeWS }
let FarAwayJs =  { callee, CalleeSimpleStream, CalleeWS }

// define some global for Vanilla Js using only on browser side
if (typeof window !== 'undefined')
  (window as any).FarAwayJs = FarAwayJs
