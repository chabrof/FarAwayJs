import { farAwayCaller as caller } from "./caller";
import { SimpleStream as CallerSimpleStream } from "./back_create/caller/simple_stream";
import { WS as CallerWS } from "./communications/caller/ws";
export { caller, CallerSimpleStream, CallerWS };
let FarAway = { caller, CallerSimpleStream, CallerWS };
// define some global for Vanilla Js using only on browser side
if (typeof window !== 'undefined')
    window.FarAway = FarAway;
