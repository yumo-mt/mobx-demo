import { asCreateObservableOptions, asObservableObject, computedDecorator, deepDecorator, endBatch, fail, getPlainObjectKeys, invariant, isComputed, isObservable, isObservableMap, refDecorator, startBatch, stringifyKey, initializeInstance } from "../internal";
import { isPlainObject } from "../utils/utils";
export function extendObservable(target, properties, decorators, options) {
    console.log(arguments)
    if (process.env.NODE_ENV !== "production") {
        invariant(arguments.length >= 2 && arguments.length <= 4, "'extendObservable' expected 2-4 arguments");
        invariant(typeof target === "object", "'extendObservable' expects an object as first argument");
        invariant(!isObservableMap(target), "'extendObservable' should not be used on maps, use map.merge instead");
    }
    options = asCreateObservableOptions(options);
    console.log(options)
    const defaultDecorator = getDefaultDecoratorFromObjectOptions(options);
    console.log(target)
    initializeInstance(target); // Fixes #1740
    console.log(target)
    // 增加$mobx属性
    asObservableObject(target, options.name, defaultDecorator.enhancer); // make sure object is observable, even without initial props
    console.log(target)
    if (properties)
        extendObservableObjectWithProperties(target, properties, decorators, defaultDecorator);
    return target;
}
export function getDefaultDecoratorFromObjectOptions(options) {
    if(options.defaultDecorator){
        return options.defaultDecorator
    }else if(options.deep === false){
        return refDecorator
    }else{
        // 默认走这个
        return deepDecorator
    }
}
export function extendObservableObjectWithProperties(target, properties, decorators, defaultDecorator) {
    if (process.env.NODE_ENV !== "production") {
        invariant(!isObservable(properties), "Extending an object with another observable (object) is not supported. Please construct an explicit propertymap, using `toJS` if need. See issue #540");
        if (decorators) {
            const keys = getPlainObjectKeys(decorators);
            for (const key of keys) {
                if (!(key in properties))
                    fail(`Trying to declare a decorator for unspecified property '${stringifyKey(key)}'`);
            }
        }
    }
     // 循环遍历，将属性经过 decorator(装饰器) 改造后添加到 target ·上
    startBatch();
    try {
        const keys = getPlainObjectKeys(properties);
        for (const key of keys) {
            // 返回自有属性对应的属性描述符
            const descriptor = Object.getOwnPropertyDescriptor(properties, key);
            const decorator = decorators && key in decorators
                ? decorators[key]
                : descriptor.get
                    ? computedDecorator
                    : defaultDecorator;
            if (process.env.NODE_ENV !== "production" && typeof decorator !== "function")
                fail(`Not a valid decorator for '${stringifyKey(key)}', got: ${decorator}`);
            const resultDescriptor = decorator(target, key, descriptor, true);
            if (resultDescriptor) // otherwise, assume already applied, due to `applyToInstance`
                Object.defineProperty(target, key, resultDescriptor);
        }
    }
    finally {
        endBatch();
    }
}
