/**
 * (c) Michel Weststrate 2015 - 2020
 * MIT Licensed
 *
 * Welcome to the mobx sources! To get an global overview of how MobX internally works,
 * this is a good place to start:
 * https://medium.com/@mweststrate/becoming-fully-reactive-an-in-depth-explanation-of-mobservable-55995262a254#.xvbh6qd74
 *
 * Source folders:
 * ===============
 *
 * - api/     Most of the public static methods exposed by the module can be found here.
 * - core/    Implementation of the MobX algorithm; atoms, derivations, reactions, dependency trees, optimizations. Cool stuff can be found here.
 * - types/   All the magic that is need to have observable objects, arrays and values is in this folder. Including the modifiers like `asFlat`.
 * - utils/   Utility stuff.
 *
 */
import { die } from "./errors";
import { getGlobal } from "./utils/global";
["Symbol", "Map", "Set", "Symbol"].forEach(m => {
    let g = getGlobal();
    if (typeof g[m] === "undefined") {
        die(`MobX requires global '${m}' to be available or polyfilled`);
    }
});
import { spy, getDebugName, $mobx } from "./internal";
export { Reaction, untracked, createAtom, spy, comparer, isObservableObject, isObservableValue as isBoxedObservable, isObservableArray, ObservableMap, isObservableMap, ObservableSet, isObservableSet, transaction, observable, computed, isObservable, isObservableProp, isComputed, isComputedProp, extendObservable, observe, intercept, autorun, reaction, when, action, isAction, runInAction, keys, values, entries, set, remove, has, get, configure, onBecomeObserved, onBecomeUnobserved, flow, flowResult, FlowCancellationError, isFlowCancellationError, toJS, trace, getDependencyTree, getObserverTree, resetGlobalState as _resetGlobalState, getGlobalState as _getGlobalState, getDebugName, getAtom, getAdministration as _getAdministration, allowStateChanges as _allowStateChanges, runInAction as _allowStateChangesInsideComputed, $mobx, isComputingDerivation as _isComputingDerivation, onReactionError, interceptReads as _interceptReads, _startAction, _endAction, allowStateReadsStart as _allowStateReadsStart, allowStateReadsEnd as _allowStateReadsEnd, makeObservable, makeAutoObservable, autoAction as _autoAction, override } from "./internal";
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "object") {
    // See: https://github.com/andykog/mobx-devtools/
    __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({
        spy,
        extras: {
            getDebugName
        },
        $mobx
    });
}
