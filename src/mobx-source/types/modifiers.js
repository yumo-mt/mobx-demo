import { deepEqual, isES6Map, isES6Set, isObservable, isObservableArray, isObservableMap, isObservableSet, isObservableObject, isPlainObject, observable, die } from "../internal";
export function deepEnhancer(v, _, name) {
    // it is an observable already, done
    if (isObservable(v))
        return v;
    // something that can be converted and mutated?
    if (Array.isArray(v))
        return observable.array(v, { name });
    if (isPlainObject(v))
        return observable.object(v, undefined, { name });
    if (isES6Map(v))
        return observable.map(v, { name });
    if (isES6Set(v))
        return observable.set(v, { name });
    return v;
}
export function shallowEnhancer(v, _, name) {
    if (v === undefined || v === null)
        return v;
    if (isObservableObject(v) || isObservableArray(v) || isObservableMap(v) || isObservableSet(v))
        return v;
    if (Array.isArray(v))
        return observable.array(v, { name, deep: false });
    if (isPlainObject(v))
        return observable.object(v, undefined, { name, deep: false });
    if (isES6Map(v))
        return observable.map(v, { name, deep: false });
    if (isES6Set(v))
        return observable.set(v, { name, deep: false });
    if (window.__DEV__)
        die("The shallow modifier / decorator can only used in combination with arrays, objects, maps and sets");
}
export function referenceEnhancer(newValue) {
    // never turn into an observable
    return newValue;
}
export function refStructEnhancer(v, oldValue) {
    if (window.__DEV__ && isObservable(v))
        die(`observable.struct should not be used with observable values`);
    if (deepEqual(v, oldValue))
        return oldValue;
    return v;
}
