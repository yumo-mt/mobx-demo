import { createAction, executeAction, storeAnnotation, die, isFunction, isStringish, createDecoratorAnnotation, createActionAnnotation } from "../internal";
export const ACTION = "action";
export const ACTION_BOUND = "action.bound";
export const AUTOACTION = "autoAction";
export const AUTOACTION_BOUND = "autoAction.bound";
const DEFAULT_ACTION_NAME = "<unnamed action>";
const actionAnnotation = createActionAnnotation(ACTION);
const actionBoundAnnotation = createActionAnnotation(ACTION_BOUND, {
    bound: true
});
const autoActionAnnotation = createActionAnnotation(AUTOACTION, {
    autoAction: true
});
const autoActionBoundAnnotation = createActionAnnotation(AUTOACTION_BOUND, {
    autoAction: true,
    bound: true
});
function createActionFactory(autoAction) {
    const res = function action(arg1, arg2) {
        // action(fn() {})
        if (isFunction(arg1))
            return createAction(arg1.name || DEFAULT_ACTION_NAME, arg1, autoAction);
        // action("name", fn() {})
        if (isFunction(arg2))
            return createAction(arg1, arg2, autoAction);
        // @action
        if (isStringish(arg2)) {
            return storeAnnotation(arg1, arg2, autoAction ? autoActionAnnotation : actionAnnotation);
        }
        // action("name") & @action("name")
        if (isStringish(arg1)) {
            return createDecoratorAnnotation(createActionAnnotation(autoAction ? AUTOACTION : ACTION, {
                name: arg1,
                autoAction
            }));
        }
        if (window.__DEV__)
            die("Invalid arguments for `action`");
    };
    return res;
}
export const action = createActionFactory(false);
Object.assign(action, actionAnnotation);
export const autoAction = createActionFactory(true);
Object.assign(autoAction, autoActionAnnotation);
action.bound = createDecoratorAnnotation(actionBoundAnnotation);
autoAction.bound = createDecoratorAnnotation(autoActionBoundAnnotation);
export function runInAction(fn) {
    return executeAction(fn.name || DEFAULT_ACTION_NAME, false, fn, this, undefined);
}
export function isAction(thing) {
    return isFunction(thing) && thing.isMobxAction === true;
}
