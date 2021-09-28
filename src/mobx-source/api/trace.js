import { TraceMode, die, getAtom, globalState } from "../internal";
export function trace(...args) {
    if (!window.__DEV__)
        die(`trace() is not available in production builds`);
    let enterBreakPoint = false;
    if (typeof args[args.length - 1] === "boolean")
        enterBreakPoint = args.pop();
    const derivation = getAtomFromArgs(args);
    if (!derivation) {
        return die(`'trace(break?)' can only be used inside a tracked computed value or a Reaction. Consider passing in the computed value or reaction explicitly`);
    }
    if (derivation.isTracing_ === TraceMode.NONE) {
        console.log(`[mobx.trace] '${derivation.name_}' tracing enabled`);
    }
    derivation.isTracing_ = enterBreakPoint ? TraceMode.BREAK : TraceMode.LOG;
}
function getAtomFromArgs(args) {
    switch (args.length) {
        case 0:
            return globalState.trackingDerivation;
        case 1:
            return getAtom(args[0]);
        case 2:
            return getAtom(args[0], args[1]);
    }
}
