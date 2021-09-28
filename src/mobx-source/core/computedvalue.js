import { CaughtException, IDerivationState_, TraceMode, autorun, clearObserving, comparer, createAction, createInstanceofPredicate, endBatch, getNextId, globalState, isCaughtException, isSpyEnabled, propagateChangeConfirmed, propagateMaybeChanged, reportObserved, shouldCompute, spyReport, startBatch, toPrimitive, trackDerivedFunction, untrackedEnd, untrackedStart, UPDATE, die, allowStateChangesStart, allowStateChangesEnd } from "../internal";
/**
 * A node in the state dependency root that observes other nodes, and can be observed itself.
 *
 * ComputedValue will remember the result of the computation for the duration of the batch, or
 * while being observed.
 *
 * During this time it will recompute only when one of its direct dependencies changed,
 * but only when it is being accessed with `ComputedValue.get()`.
 *
 * Implementation description:
 * 1. First time it's being accessed it will compute and remember result
 *    give back remembered result until 2. happens
 * 2. First time any deep dependency change, propagate POSSIBLY_STALE to all observers, wait for 3.
 * 3. When it's being accessed, recompute if any shallow dependency changed.
 *    if result changed: propagate STALE to all observers, that were POSSIBLY_STALE from the last step.
 *    go to step 2. either way
 *
 * If at any point it's outside batch and it isn't observed: reset everything and go to 1.
 */
export class ComputedValue {
    /**
     * Create a new computed value based on a function expression.
     *
     * The `name` property is for debug purposes only.
     *
     * The `equals` property specifies the comparer function to use to determine if a newly produced
     * value differs from the previous value. Two comparers are provided in the library; `defaultComparer`
     * compares based on identity comparison (===), and `structuralComparer` deeply compares the structure.
     * Structural comparison can be convenient if you always produce a new aggregated object and
     * don't want to notify observers if it is structurally the same.
     * This is useful for working with vectors, mouse coordinates etc.
     */
    constructor(options) {
        this.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
        this.observing_ = []; // nodes we are looking at. Our value depends on these nodes
        this.newObserving_ = null; // during tracking it's an array with new observed observers
        this.isBeingObserved_ = false;
        this.isPendingUnobservation_ = false;
        this.observers_ = new Set();
        this.diffValue_ = 0;
        this.runId_ = 0;
        this.lastAccessedBy_ = 0;
        this.lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
        this.unboundDepsCount_ = 0;
        this.mapid_ = "#" + getNextId();
        this.value_ = new CaughtException(null);
        this.isComputing_ = false; // to check for cycles
        this.isRunningSetter_ = false;
        this.isTracing_ = TraceMode.NONE;
        if (!options.get)
            die(31);
        this.derivation = options.get;
        this.name_ = options.name || "ComputedValue@" + getNextId();
        if (options.set)
            this.setter_ = createAction(this.name_ + "-setter", options.set);
        this.equals_ =
            options.equals ||
                (options.compareStructural || options.struct
                    ? comparer.structural
                    : comparer.default);
        this.scope_ = options.context;
        this.requiresReaction_ = !!options.requiresReaction;
        this.keepAlive_ = !!options.keepAlive;
    }
    onBecomeStale_() {
        propagateMaybeChanged(this);
    }
    onBO() {
        if (this.onBOL) {
            this.onBOL.forEach(listener => listener());
        }
    }
    onBUO() {
        if (this.onBUOL) {
            this.onBUOL.forEach(listener => listener());
        }
    }
    /**
     * Returns the current value of this computed value.
     * Will evaluate its computation first if needed.
     */
    get() {
        if (this.isComputing_)
            die(32, this.name_, this.derivation);
        if (globalState.inBatch === 0 &&
            // !globalState.trackingDerivatpion &&
            this.observers_.size === 0 &&
            !this.keepAlive_) {
            if (shouldCompute(this)) {
                this.warnAboutUntrackedRead_();
                startBatch(); // See perf test 'computed memoization'
                this.value_ = this.computeValue_(false);
                endBatch();
            }
        }
        else {
            reportObserved(this);
            if (shouldCompute(this)) {
                let prevTrackingContext = globalState.trackingContext;
                if (this.keepAlive_ && !prevTrackingContext)
                    globalState.trackingContext = this;
                if (this.trackAndCompute())
                    propagateChangeConfirmed(this);
                globalState.trackingContext = prevTrackingContext;
            }
        }
        const result = this.value_;
        if (isCaughtException(result))
            throw result.cause;
        return result;
    }
    set(value) {
        if (this.setter_) {
            if (this.isRunningSetter_)
                die(33, this.name_);
            this.isRunningSetter_ = true;
            try {
                this.setter_.call(this.scope_, value);
            }
            finally {
                this.isRunningSetter_ = false;
            }
        }
        else
            die(34, this.name_);
    }
    trackAndCompute() {
        // N.B: unminified as it is used by MST
        const oldValue = this.value_;
        const wasSuspended = 
        /* see #1208 */ this.dependenciesState_ === IDerivationState_.NOT_TRACKING_;
        const newValue = this.computeValue_(true);
        if (__DEV__ && isSpyEnabled()) {
            spyReport({
                observableKind: "computed",
                debugObjectName: this.name_,
                object: this.scope_,
                type: "update",
                oldValue: this.value_,
                newValue
            });
        }
        const changed = wasSuspended ||
            isCaughtException(oldValue) ||
            isCaughtException(newValue) ||
            !this.equals_(oldValue, newValue);
        if (changed) {
            this.value_ = newValue;
        }
        return changed;
    }
    computeValue_(track) {
        this.isComputing_ = true;
        // don't allow state changes during computation
        const prev = allowStateChangesStart(false);
        let res;
        if (track) {
            res = trackDerivedFunction(this, this.derivation, this.scope_);
        }
        else {
            if (globalState.disableErrorBoundaries === true) {
                res = this.derivation.call(this.scope_);
            }
            else {
                try {
                    res = this.derivation.call(this.scope_);
                }
                catch (e) {
                    res = new CaughtException(e);
                }
            }
        }
        allowStateChangesEnd(prev);
        this.isComputing_ = false;
        return res;
    }
    suspend_() {
        if (!this.keepAlive_) {
            clearObserving(this);
            this.value_ = undefined; // don't hold on to computed value!
        }
    }
    observe_(listener, fireImmediately) {
        let firstTime = true;
        let prevValue = undefined;
        return autorun(() => {
            // TODO: why is this in a different place than the spyReport() function? in all other observables it's called in the same place
            let newValue = this.get();
            if (!firstTime || fireImmediately) {
                const prevU = untrackedStart();
                listener({
                    observableKind: "computed",
                    debugObjectName: this.name_,
                    type: UPDATE,
                    object: this,
                    newValue,
                    oldValue: prevValue
                });
                untrackedEnd(prevU);
            }
            firstTime = false;
            prevValue = newValue;
        });
    }
    warnAboutUntrackedRead_() {
        if (!__DEV__)
            return;
        if (this.requiresReaction_ === true) {
            die(`[mobx] Computed value ${this.name_} is read outside a reactive context`);
        }
        if (this.isTracing_ !== TraceMode.NONE) {
            console.log(`[mobx.trace] '${this.name_}' is being read outside a reactive context. Doing a full recompute`);
        }
        if (globalState.computedRequiresReaction) {
            console.warn(`[mobx] Computed value ${this.name_} is being read outside a reactive context. Doing a full recompute`);
        }
    }
    toString() {
        return `${this.name_}[${this.derivation.toString()}]`;
    }
    valueOf() {
        return toPrimitive(this.get());
    }
    [Symbol.toPrimitive]() {
        return this.valueOf();
    }
}
export const isComputedValue = createInstanceofPredicate("ComputedValue", ComputedValue);
