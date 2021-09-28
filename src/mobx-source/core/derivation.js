import { addObserver, globalState, isComputedValue, removeObserver } from "../internal";
export var IDerivationState_;
(function (IDerivationState_) {
    // before being run or (outside batch and not being observed)
    // at this point derivation is not holding any data about dependency tree
    IDerivationState_[IDerivationState_["NOT_TRACKING_"] = -1] = "NOT_TRACKING_";
    // no shallow dependency changed since last computation
    // won't recalculate derivation
    // this is what makes mobx fast
    IDerivationState_[IDerivationState_["UP_TO_DATE_"] = 0] = "UP_TO_DATE_";
    // some deep dependency changed, but don't know if shallow dependency changed
    // will require to check first if UP_TO_DATE or POSSIBLY_STALE
    // currently only ComputedValue will propagate POSSIBLY_STALE
    //
    // having this state is second big optimization:
    // don't have to recompute on every dependency change, but only when it's needed
    IDerivationState_[IDerivationState_["POSSIBLY_STALE_"] = 1] = "POSSIBLY_STALE_";
    // A shallow dependency has changed since last computation and the derivation
    // will need to recompute when it's needed next.
    IDerivationState_[IDerivationState_["STALE_"] = 2] = "STALE_";
})(IDerivationState_ || (IDerivationState_ = {}));
export var TraceMode;
(function (TraceMode) {
    TraceMode[TraceMode["NONE"] = 0] = "NONE";
    TraceMode[TraceMode["LOG"] = 1] = "LOG";
    TraceMode[TraceMode["BREAK"] = 2] = "BREAK";
})(TraceMode || (TraceMode = {}));
export class CaughtException {
    constructor(cause) {
        this.cause = cause;
        // Empty
    }
}
export function isCaughtException(e) {
    return e instanceof CaughtException;
}
/**
 * Finds out whether any dependency of the derivation has actually changed.
 * If dependenciesState is 1 then it will recalculate dependencies,
 * if any dependency changed it will propagate it by changing dependenciesState to 2.
 *
 * By iterating over the dependencies in the same order that they were reported and
 * stopping on the first change, all the recalculations are only called for ComputedValues
 * that will be tracked by derivation. That is because we assume that if the first x
 * dependencies of the derivation doesn't change then the derivation should run the same way
 * up until accessing x-th dependency.
 */
export function shouldCompute(derivation) {
    switch (derivation.dependenciesState_) {
        case IDerivationState_.UP_TO_DATE_:
            return false;
        case IDerivationState_.NOT_TRACKING_:
        case IDerivationState_.STALE_:
            return true;
        case IDerivationState_.POSSIBLY_STALE_: {
            // state propagation can occur outside of action/reactive context #2195
            const prevAllowStateReads = allowStateReadsStart(true);
            const prevUntracked = untrackedStart(); // no need for those computeds to be reported, they will be picked up in trackDerivedFunction.
            const obs = derivation.observing_, l = obs.length;
            for (let i = 0; i < l; i++) {
                const obj = obs[i];
                if (isComputedValue(obj)) {
                    if (globalState.disableErrorBoundaries) {
                        obj.get();
                    }
                    else {
                        try {
                            obj.get();
                        }
                        catch (e) {
                            // we are not interested in the value *or* exception at this moment, but if there is one, notify all
                            untrackedEnd(prevUntracked);
                            allowStateReadsEnd(prevAllowStateReads);
                            return true;
                        }
                    }
                    // if ComputedValue `obj` actually changed it will be computed and propagated to its observers.
                    // and `derivation` is an observer of `obj`
                    // invariantShouldCompute(derivation)
                    if (derivation.dependenciesState_ === IDerivationState_.STALE_) {
                        untrackedEnd(prevUntracked);
                        allowStateReadsEnd(prevAllowStateReads);
                        return true;
                    }
                }
            }
            changeDependenciesStateTo0(derivation);
            untrackedEnd(prevUntracked);
            allowStateReadsEnd(prevAllowStateReads);
            return false;
        }
    }
}
export function isComputingDerivation() {
    return globalState.trackingDerivation !== null; // filter out actions inside computations
}
export function checkIfStateModificationsAreAllowed(atom) {
    if (!window.__DEV__) {
        return;
    }
    const hasObservers = atom.observers_.size > 0;
    // Should not be possible to change observed state outside strict mode, except during initialization, see #563
    if (!globalState.allowStateChanges && (hasObservers || globalState.enforceActions === "always"))
        console.warn("[MobX] " +
            (globalState.enforceActions
                ? "Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed. Tried to modify: "
                : "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, a computed value or the render function of a React component? You can wrap side effects in 'runInAction' (or decorate functions with 'action') if needed. Tried to modify: ") +
            atom.name_);
}
export function checkIfStateReadsAreAllowed(observable) {
    if (window.__DEV__ && !globalState.allowStateReads && globalState.observableRequiresReaction) {
        console.warn(`[mobx] Observable ${observable.name_} being read outside a reactive context`);
    }
}
/**
 * Executes the provided function `f` and tracks which observables are being accessed.
 * The tracking information is stored on the `derivation` object and the derivation is registered
 * as observer of any of the accessed observables.
 */
export function trackDerivedFunction(derivation, f, context) {
    const prevAllowStateReads = allowStateReadsStart(true);
    // pre allocate array allocation + room for variation in deps
    // array will be trimmed by bindDependencies
    changeDependenciesStateTo0(derivation);
    derivation.newObserving_ = new Array(derivation.observing_.length + 100);
    derivation.unboundDepsCount_ = 0;
    derivation.runId_ = ++globalState.runId;
    const prevTracking = globalState.trackingDerivation;
    globalState.trackingDerivation = derivation;
    globalState.inBatch++;
    let result;
    if (globalState.disableErrorBoundaries === true) {
        result = f.call(context);
    }
    else {
        try {
            result = f.call(context);
        }
        catch (e) {
            result = new CaughtException(e);
        }
    }
    globalState.inBatch--;
    globalState.trackingDerivation = prevTracking;
    bindDependencies(derivation);
    warnAboutDerivationWithoutDependencies(derivation);
    allowStateReadsEnd(prevAllowStateReads);
    return result;
}
function warnAboutDerivationWithoutDependencies(derivation) {
    if (!window.__DEV__)
        return;
    if (derivation.observing_.length !== 0)
        return;
    if (globalState.reactionRequiresObservable || derivation.requiresObservable_) {
        console.warn(`[mobx] Derivation ${derivation.name_} is created/updated without reading any observable value`);
    }
}
/**
 * diffs newObserving with observing.
 * update observing to be newObserving with unique observables
 * notify observers that become observed/unobserved
 */
function bindDependencies(derivation) {
    // invariant(derivation.dependenciesState !== IDerivationState.NOT_TRACKING, "INTERNAL ERROR bindDependencies expects derivation.dependenciesState !== -1");
    const prevObserving = derivation.observing_;
    const observing = (derivation.observing_ = derivation.newObserving_);
    let lowestNewObservingDerivationState = IDerivationState_.UP_TO_DATE_;
    // Go through all new observables and check diffValue: (this list can contain duplicates):
    //   0: first occurrence, change to 1 and keep it
    //   1: extra occurrence, drop it
    let i0 = 0, l = derivation.unboundDepsCount_;
    for (let i = 0; i < l; i++) {
        const dep = observing[i];
        if (dep.diffValue_ === 0) {
            dep.diffValue_ = 1;
            if (i0 !== i)
                observing[i0] = dep;
            i0++;
        }
        // Upcast is 'safe' here, because if dep is IObservable, `dependenciesState` will be undefined,
        // not hitting the condition
        if (dep.dependenciesState_ > lowestNewObservingDerivationState) {
            lowestNewObservingDerivationState = dep.dependenciesState_;
        }
    }
    observing.length = i0;
    derivation.newObserving_ = null; // newObserving shouldn't be needed outside tracking (statement moved down to work around FF bug, see #614)
    // Go through all old observables and check diffValue: (it is unique after last bindDependencies)
    //   0: it's not in new observables, unobserve it
    //   1: it keeps being observed, don't want to notify it. change to 0
    l = prevObserving.length;
    while (l--) {
        const dep = prevObserving[l];
        if (dep.diffValue_ === 0) {
            removeObserver(dep, derivation);
        }
        dep.diffValue_ = 0;
    }
    // Go through all new observables and check diffValue: (now it should be unique)
    //   0: it was set to 0 in last loop. don't need to do anything.
    //   1: it wasn't observed, let's observe it. set back to 0
    while (i0--) {
        const dep = observing[i0];
        if (dep.diffValue_ === 1) {
            dep.diffValue_ = 0;
            addObserver(dep, derivation);
        }
    }
    // Some new observed derivations may become stale during this derivation computation
    // so they have had no chance to propagate staleness (#916)
    if (lowestNewObservingDerivationState !== IDerivationState_.UP_TO_DATE_) {
        derivation.dependenciesState_ = lowestNewObservingDerivationState;
        derivation.onBecomeStale_();
    }
}
export function clearObserving(derivation) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR clearObserving should be called only inside batch");
    const obs = derivation.observing_;
    derivation.observing_ = [];
    let i = obs.length;
    while (i--)
        removeObserver(obs[i], derivation);
    derivation.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
}
export function untracked(action) {
    const prev = untrackedStart();
    try {
        return action();
    }
    finally {
        untrackedEnd(prev);
    }
}
export function untrackedStart() {
    const prev = globalState.trackingDerivation;
    globalState.trackingDerivation = null;
    return prev;
}
export function untrackedEnd(prev) {
    globalState.trackingDerivation = prev;
}
export function allowStateReadsStart(allowStateReads) {
    const prev = globalState.allowStateReads;
    globalState.allowStateReads = allowStateReads;
    return prev;
}
export function allowStateReadsEnd(prev) {
    globalState.allowStateReads = prev;
}
/**
 * needed to keep `lowestObserverState` correct. when changing from (2 or 1) to 0
 *
 */
export function changeDependenciesStateTo0(derivation) {
    if (derivation.dependenciesState_ === IDerivationState_.UP_TO_DATE_)
        return;
    derivation.dependenciesState_ = IDerivationState_.UP_TO_DATE_;
    const obs = derivation.observing_;
    let i = obs.length;
    while (i--)
        obs[i].lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
}
