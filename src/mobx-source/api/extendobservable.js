import { isObservableMap, startBatch, endBatch, asObservableObject, isPlainObject, isObservable, die, getOwnPropertyDescriptors, $mobx, ownKeys } from "../internal";
export function extendObservable(target, properties, annotations, options) {
    if (window.__DEV__) {
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
    console.log(adm)
    startBatch();
    try {
        const keys = ownKeys(descriptors)
        keys.forEach(key => {
            // must pass "undefined" for { key: undefined }
            const val = !annotations ? true : key in annotations ? annotations[key] : true
            adm.extend_(key, descriptors[key], val);
        });
    }
    finally {
        endBatch();
    }
    return target;
}
