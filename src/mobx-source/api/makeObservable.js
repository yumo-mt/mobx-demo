import { $mobx, asObservableObject, endBatch, startBatch, collectStoredAnnotations, isPlainObject, isObservableObject, die, ownKeys, objectPrototype, inferredAnnotationsSymbol, extendObservable } from "../internal";
export function makeObservable(target, annotations, options) {
    const adm = asObservableObject(target, options)[$mobx];
    startBatch();
    try {
        // Default to decorators
        annotations !== null && annotations !== void 0 ? annotations : (annotations = collectStoredAnnotations(target));
        // Annotate
        ownKeys(annotations).forEach(key => adm.make_(key, annotations[key]));
    }
    finally {
        endBatch();
    }
    return target;
}
export function makeAutoObservable(target, overrides, options) {
    if (window.__DEV__) {
        if (!isPlainObject(target) && !isPlainObject(Object.getPrototypeOf(target)))
            die(`'makeAutoObservable' can only be used for classes that don't have a superclass`);
        if (isObservableObject(target))
            die(`makeAutoObservable can only be used on objects not already made observable`);
    }
    // Optimization (avoids visiting protos)
    // assumes that annotation.make_/.extend_ works the same for plain objects
    if (isPlainObject(target)) {
        return extendObservable(target, target, overrides, options);
    }
    const adm = asObservableObject(target, options)[$mobx];
    startBatch();
    try {
        if (target[inferredAnnotationsSymbol]) {
            for (let key in target[inferredAnnotationsSymbol]) {
                adm.make_(key, target[inferredAnnotationsSymbol][key]);
            }
        }
        else {
            const ignoreKeys = { [$mobx]: 1, [inferredAnnotationsSymbol]: 1, constructor: 1 };
            const make = key => {
                if (ignoreKeys[key])
                    return;
                ignoreKeys[key] = 1;
                adm.make_(key, 
                // must pass "undefined" for { key: undefined }
                !overrides ? true : key in overrides ? overrides[key] : true);
            };
            let current = target;
            while (current && current !== objectPrototype) {
                ownKeys(current).forEach(make);
                current = Object.getPrototypeOf(current);
            }
        }
    }
    finally {
        endBatch();
    }
    return target;
}
