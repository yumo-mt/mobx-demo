import { $mobx, isAtom, isComputedValue, isObservableArray, isObservableMap, isObservableObject, isReaction, isObservableSet, die, isFunction } from "../internal";
export function getAtom(thing, property) {
    if (typeof thing === "object" && thing !== null) {
        if (isObservableArray(thing)) {
            if (property !== undefined)
                die(23);
            return thing[$mobx].atom_;
        }
        if (isObservableSet(thing)) {
            return thing[$mobx];
        }
        if (isObservableMap(thing)) {
            if (property === undefined)
                return thing.keysAtom_;
            const observable = thing.data_.get(property) || thing.hasMap_.get(property);
            if (!observable)
                die(25, property, getDebugName(thing));
            return observable;
        }
        if (property && !thing[$mobx])
            thing[property]; // See #1072
        if (isObservableObject(thing)) {
            if (!property)
                return die(26);
            const observable = thing[$mobx].values_.get(property);
            if (!observable)
                die(27, property, getDebugName(thing));
            return observable;
        }
        if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) {
            return thing;
        }
    }
    else if (isFunction(thing)) {
        if (isReaction(thing[$mobx])) {
            // disposer function
            return thing[$mobx];
        }
    }
    die(28);
}
export function getAdministration(thing, property) {
    if (!thing)
        die(29);
    if (property !== undefined)
        return getAdministration(getAtom(thing, property));
    if (isAtom(thing) || isComputedValue(thing) || isReaction(thing))
        return thing;
    if (isObservableMap(thing) || isObservableSet(thing))
        return thing;
    if (thing[$mobx])
        return thing[$mobx];
    die(24, thing);
}
export function getDebugName(thing, property) {
    let named;
    if (property !== undefined)
        named = getAtom(thing, property);
    else if (isObservableObject(thing) || isObservableMap(thing) || isObservableSet(thing))
        named = getAdministration(thing);
    else
        named = getAtom(thing); // valid for arrays as well
    return named.name_;
}
