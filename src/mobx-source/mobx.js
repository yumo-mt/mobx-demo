/**
 * (c) Michel Weststrate 2015 - 2018
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
 *   version: 5.15.0
 */
import { getGlobal, spy, getDebugName, $mobx } from "./internal";
if (typeof Proxy === "undefined" || typeof Symbol === "undefined") {
    throw new Error("[mobx] MobX 5+ requires Proxy and Symbol objects. If your environment doesn't support Symbol or Proxy objects, please downgrade to MobX 4. For React Native Android, consider upgrading JSCore.");
}
try {
    // define process.env if needed
    // if this is not a production build in the first place
    // (in which case the expression below would be substituted with 'production')
    process.env.NODE_ENV;
}
catch (e) {
    const g = getGlobal();
    if (typeof process === "undefined")
        g.process = {};
    g.process.env = {};
}
;
(() => {
    function testCodeMinification() { }
    if (testCodeMinification.name !== "testCodeMinification" &&
        process.env.NODE_ENV !== "production" &&
        process.env.IGNORE_MOBX_MINIFY_WARNING !== "true") {
        // trick so it doesn't get replaced
        const varName = ["process", "env", "NODE_ENV"].join(".");
        console.warn(`[mobx] you are running a minified build, but '${varName}' was not set to 'production' in your bundler. This results in an unnecessarily large and slow bundle`);
    }
})();
export { Reaction, untracked, IDerivationState, createAtom, spy, comparer, isObservableObject, isObservableValue as isBoxedObservable, isObservableArray, ObservableMap, isObservableMap, ObservableSet, isObservableSet, transaction, observable, computed, isObservable, isObservableProp, isComputed, isComputedProp, extendObservable, observe, intercept, autorun, reaction, when, action, isAction, runInAction, keys, values, entries, set, remove, has, get, decorate, configure, onBecomeObserved, onBecomeUnobserved, flow, FlowCancellationError, isFlowCancellationError, toJS, trace, getDependencyTree, getObserverTree, resetGlobalState as _resetGlobalState, getGlobalState as _getGlobalState, getDebugName, getAtom, getAdministration as _getAdministration, allowStateChanges as _allowStateChanges, allowStateChangesInsideComputed as _allowStateChangesInsideComputed, isArrayLike, $mobx, isComputingDerivation as _isComputingDerivation, onReactionError, interceptReads as _interceptReads, _startAction, _endAction } from "./internal";
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
