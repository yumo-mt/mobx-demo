import { isObservableMap, startBatch, endBatch, asObservableObject, isPlainObject, isObservable, die, getOwnPropertyDescriptors, $mobx, ownKeys } from "../internal";
export function extendObservable(target, properties, annotations, options) {
    if (__DEV__) {
        if (arguments.length > 4)
            die("'extendObservable' expected 2-4 arguments");
        if (typeof target !== "object")
            die("'extendObservable' expects an object as first argument");
        if (isObservableMap(target))
            die("'extendObservable' should not be used on maps, use map.merge instead");
        if (!isPlainObject(properties))
            die(`'extendObservabe' only accepts plain objects as second argument`);
        if (isObservable(properties) || isObservable(annotations))
            die(`Extending an object with another observable (object) is not supported`);
    }
    // Pull descriptors first, so we don't have to deal with props added by administration ($mobx)
    const descriptors = getOwnPropertyDescriptors(properties);
    const adm = asObservableObject(target, options)[$mobx];
    startBatch();
    try {
        ownKeys(descriptors).forEach(key => {
            adm.extend_(key, descriptors[key], 
            // must pass "undefined" for { key: undefined }
            !annotations ? true : key in annotations ? annotations[key] : true);
        });
    }
    finally {
        endBatch();
    }
    return target;
}
