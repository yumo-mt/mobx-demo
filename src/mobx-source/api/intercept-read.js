import { getAdministration, isObservableArray, isObservableMap, isObservableObject, isObservableValue, die, isStringish } from "../internal";
export function interceptReads(thing, propOrHandler, handler) {
    let target;
    if (isObservableMap(thing) || isObservableArray(thing) || isObservableValue(thing)) {
        target = getAdministration(thing);
    }
    else if (isObservableObject(thing)) {
        if (__DEV__ && !isStringish(propOrHandler))
            return die(`InterceptReads can only be used with a specific property, not with an object in general`);
        target = getAdministration(thing, propOrHandler);
    }
    else if (__DEV__) {
        return die(`Expected observable map, object or array as first array`);
    }
    if (__DEV__ && target.dehancer !== undefined)
        return die(`An intercept reader was already established`);
    target.dehancer = typeof propOrHandler === "function" ? propOrHandler : handler;
    return () => {
        target.dehancer = undefined;
    };
}
