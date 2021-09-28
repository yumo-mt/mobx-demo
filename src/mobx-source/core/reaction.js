import { $mobx, IDerivationState_, TraceMode, clearObserving, createInstanceofPredicate, endBatch, getNextId, globalState, isCaughtException, isSpyEnabled, shouldCompute, spyReport, spyReportEnd, spyReportStart, startBatch, trace, trackDerivedFunction } from "../internal";
export class Reaction {
    constructor(name_ = "Reaction@" + getNextId(), onInvalidate_, errorHandler_, requiresObservable_ = false) {
        this.name_ = name_;
        this.onInvalidate_ = onInvalidate_;
        this.errorHandler_ = errorHandler_;
        this.requiresObservable_ = requiresObservable_;
        this.observing_ = []; // nodes we are looking at. Our value depends on these nodes
        this.newObserving_ = [];
        this.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
        this.diffValue_ = 0;
        this.runId_ = 0;
        this.unboundDepsCount_ = 0;
        this.mapid_ = "#" + getNextId();
        this.isDisposed_ = false;
        this.isScheduled_ = false;
        this.isTrackPending_ = false;
        this.isRunning_ = false;
        this.isTracing_ = TraceMode.NONE;
    }
    onBecomeStale_() {
        this.schedule_();
    }
    schedule_() {
        if (!this.isScheduled_) {
            this.isScheduled_ = true;
            globalState.pendingReactions.push(this);
            runReactions();
        }
    }
    isScheduled() {
        return this.isScheduled_;
    }
    /**
     * internal, use schedule() if you intend to kick off a reaction
     */
    runReaction_() {
        if (!this.isDisposed_) {
            startBatch();
            this.isScheduled_ = false;
            const prev = globalState.trackingContext;
            globalState.trackingContext = this;
            if (shouldCompute(this)) {
                this.isTrackPending_ = true;
                try {
                    this.onInvalidate_();
                    if (window.__DEV__ && this.isTrackPending_ && isSpyEnabled()) {
                        // onInvalidate didn't trigger track right away..
                        spyReport({
                            name: this.name_,
                            type: "scheduled-reaction"
                        });
                    }
                }
                catch (e) {
                    this.reportExceptionInDerivation_(e);
                }
            }
            globalState.trackingContext = prev;
            endBatch();
        }
    }
    track(fn) {
        if (this.isDisposed_) {
            return;
            // console.warn("Reaction already disposed") // Note: Not a warning / error in mobx 4 either
        }
        startBatch();
        const notify = isSpyEnabled();
        let startTime;
        if (window.__DEV__ && notify) {
            startTime = Date.now();
            spyReportStart({
                name: this.name_,
                type: "reaction"
            });
        }
        this.isRunning_ = true;
        const prevReaction = globalState.trackingContext; // reactions could create reactions...
        globalState.trackingContext = this;
        const result = trackDerivedFunction(this, fn, undefined);
        globalState.trackingContext = prevReaction;
        this.isRunning_ = false;
        this.isTrackPending_ = false;
        if (this.isDisposed_) {
            // disposed during last run. Clean up everything that was bound after the dispose call.
            clearObserving(this);
        }
        if (isCaughtException(result))
            this.reportExceptionInDerivation_(result.cause);
        if (window.__DEV__ && notify) {
            spyReportEnd({
                time: Date.now() - startTime
            });
        }
        endBatch();
    }
    reportExceptionInDerivation_(error) {
        if (this.errorHandler_) {
            this.errorHandler_(error, this);
            return;
        }
        if (globalState.disableErrorBoundaries)
            throw error;
        const message = window.__DEV__
            ? `[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '${this}'`
            : `[mobx] uncaught error in '${this}'`;
        if (!globalState.suppressReactionErrors) {
            console.error(message, error);
            /** If debugging brought you here, please, read the above message :-). Tnx! */
        }
        else if (window.__DEV__)
            console.warn(`[mobx] (error in reaction '${this.name_}' suppressed, fix error of causing action below)`); // prettier-ignore
        if (window.__DEV__ && isSpyEnabled()) {
            spyReport({
                type: "error",
                name: this.name_,
                message,
                error: "" + error
            });
        }
        globalState.globalReactionErrorHandlers.forEach(f => f(error, this));
    }
    dispose() {
        if (!this.isDisposed_) {
            this.isDisposed_ = true;
            if (!this.isRunning_) {
                // if disposed while running, clean up later. Maybe not optimal, but rare case
                startBatch();
                clearObserving(this);
                endBatch();
            }
        }
    }
    getDisposer_() {
        const r = this.dispose.bind(this);
        r[$mobx] = this;
        return r;
    }
    toString() {
        return `Reaction[${this.name_}]`;
    }
    trace(enterBreakPoint = false) {
        trace(this, enterBreakPoint);
    }
}
export function onReactionError(handler) {
    globalState.globalReactionErrorHandlers.push(handler);
    return () => {
        const idx = globalState.globalReactionErrorHandlers.indexOf(handler);
        if (idx >= 0)
            globalState.globalReactionErrorHandlers.splice(idx, 1);
    };
}
/**
 * Magic number alert!
 * Defines within how many times a reaction is allowed to re-trigger itself
 * until it is assumed that this is gonna be a never ending loop...
 */
const MAX_REACTION_ITERATIONS = 100;
let reactionScheduler = f => f();
export function runReactions() {
    // Trampolining, if runReactions are already running, new reactions will be picked up
    if (globalState.inBatch > 0 || globalState.isRunningReactions)
        return;
    reactionScheduler(runReactionsHelper);
}
function runReactionsHelper() {
    globalState.isRunningReactions = true;
    const allReactions = globalState.pendingReactions;
    let iterations = 0;
    // While running reactions, new reactions might be triggered.
    // Hence we work with two variables and check whether
    // we converge to no remaining reactions after a while.
    while (allReactions.length > 0) {
        if (++iterations === MAX_REACTION_ITERATIONS) {
            console.error(window.__DEV__
                ? `Reaction doesn't converge to a stable state after ${MAX_REACTION_ITERATIONS} iterations.` +
                    ` Probably there is a cycle in the reactive function: ${allReactions[0]}`
                : `[mobx] cycle in reaction: ${allReactions[0]}`);
            allReactions.splice(0); // clear reactions
        }
        let remainingReactions = allReactions.splice(0);
        for (let i = 0, l = remainingReactions.length; i < l; i++)
            remainingReactions[i].runReaction_();
    }
    globalState.isRunningReactions = false;
}
export const isReaction = createInstanceofPredicate("Reaction", Reaction);
export function setReactionScheduler(fn) {
    const baseScheduler = reactionScheduler;
    reactionScheduler = f => fn(() => baseScheduler(f));
}
