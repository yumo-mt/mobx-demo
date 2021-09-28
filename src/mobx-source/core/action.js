var _a, _b;
import { endBatch, globalState, isSpyEnabled, spyReportEnd, spyReportStart, startBatch, untrackedEnd, untrackedStart, isFunction, allowStateReadsStart, allowStateReadsEnd, ACTION, EMPTY_ARRAY, die, getDescriptor } from "../internal";
// we don't use globalState for these in order to avoid possible issues with multiple
// mobx versions
let currentActionId = 0;
let nextActionId = 1;
const isFunctionNameConfigurable = (_b = (_a = getDescriptor(() => { }, "name")) === null || _a === void 0 ? void 0 : _a.configurable) !== null && _b !== void 0 ? _b : false;
// we can safely recycle this object
const tmpNameDescriptor = {
    value: "action",
    configurable: true,
    writable: false,
    enumerable: false
};
export function createAction(actionName, fn, autoAction = false, ref) {
    if (window.__DEV__) {
        if (!isFunction(fn))
            die("`action` can only be invoked on functions");
        if (typeof actionName !== "string" || !actionName)
            die(`actions should have valid names, got: '${actionName}'`);
    }
    function res() {
        return executeAction(actionName, autoAction, fn, ref || this, arguments);
    }
    res.isMobxAction = true;
    if (isFunctionNameConfigurable) {
        tmpNameDescriptor.value = actionName;
        Object.defineProperty(res, "name", tmpNameDescriptor);
    }
    return res;
}
export function executeAction(actionName, canRunAsDerivation, fn, scope, args) {
    const runInfo = _startAction(actionName, canRunAsDerivation, scope, args);
    try {
        return fn.apply(scope, args);
    }
    catch (err) {
        runInfo.error_ = err;
        throw err;
    }
    finally {
        _endAction(runInfo);
    }
}
export function _startAction(actionName, canRunAsDerivation, // true for autoAction
scope, args) {
    const notifySpy_ = window.__DEV__ && isSpyEnabled() && !!actionName;
    let startTime_ = 0;
    if (window.__DEV__ && notifySpy_) {
        startTime_ = Date.now();
        const flattenedArgs = args ? Array.from(args) : EMPTY_ARRAY;
        spyReportStart({
            type: ACTION,
            name: actionName,
            object: scope,
            arguments: flattenedArgs
        });
    }
    const prevDerivation_ = globalState.trackingDerivation;
    const runAsAction = !canRunAsDerivation || !prevDerivation_;
    startBatch();
    let prevAllowStateChanges_ = globalState.allowStateChanges; // by default preserve previous allow
    if (runAsAction) {
        untrackedStart();
        prevAllowStateChanges_ = allowStateChangesStart(true);
    }
    const prevAllowStateReads_ = allowStateReadsStart(true);
    const runInfo = {
        runAsAction_: runAsAction,
        prevDerivation_,
        prevAllowStateChanges_,
        prevAllowStateReads_,
        notifySpy_,
        startTime_,
        actionId_: nextActionId++,
        parentActionId_: currentActionId
    };
    currentActionId = runInfo.actionId_;
    return runInfo;
}
export function _endAction(runInfo) {
    if (currentActionId !== runInfo.actionId_) {
        die(30);
    }
    currentActionId = runInfo.parentActionId_;
    if (runInfo.error_ !== undefined) {
        globalState.suppressReactionErrors = true;
    }
    allowStateChangesEnd(runInfo.prevAllowStateChanges_);
    allowStateReadsEnd(runInfo.prevAllowStateReads_);
    endBatch();
    if (runInfo.runAsAction_)
        untrackedEnd(runInfo.prevDerivation_);
    if (window.__DEV__ && runInfo.notifySpy_) {
        spyReportEnd({ time: Date.now() - runInfo.startTime_ });
    }
    globalState.suppressReactionErrors = false;
}
export function allowStateChanges(allowStateChanges, func) {
    const prev = allowStateChangesStart(allowStateChanges);
    try {
        return func();
    }
    finally {
        allowStateChangesEnd(prev);
    }
}
export function allowStateChangesStart(allowStateChanges) {
    const prev = globalState.allowStateChanges;
    globalState.allowStateChanges = allowStateChanges;
    return prev;
}
export function allowStateChangesEnd(prev) {
    globalState.allowStateChanges = prev;
}
