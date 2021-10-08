import { ObservableMap, ObservableSet, ObservableValue, createDecoratorForEnhancer, createDynamicObservableObject, createObservableArray, deepEnhancer, extendObservable, fail, isES6Map, isES6Set, isObservable, isPlainObject, refStructEnhancer, referenceEnhancer, shallowEnhancer, getDefaultDecoratorFromObjectOptions, extendObservableObjectWithProperties } from "../internal";
// Predefined bags of create observable options, to avoid allocating temporarily option objects
// in the majority of cases
export const defaultCreateObservableOptions = {
    deep: true,
    name: undefined,
    defaultDecorator: undefined,
    proxy: true
};
Object.freeze(defaultCreateObservableOptions);
function assertValidOption(key) {
    if (!/^(deep|name|equals|defaultDecorator|proxy)$/.test(key))
        fail(`invalid option for (extend)observable: ${key}`);
}
// 校验一下参数
export function asCreateObservableOptions(thing) {
    if (thing === null || thing === undefined)
        return defaultCreateObservableOptions;
    if (typeof thing === "string")
        return { name: thing, deep: true, proxy: true };
    if (process.env.NODE_ENV !== "production") {
        if (typeof thing !== "object")
            return fail("expected options object");
        Object.keys(thing).forEach(assertValidOption);
    }
    return thing;
}
// 基于 enhancer 创建装饰器
export const deepDecorator = createDecoratorForEnhancer(deepEnhancer); // 默认的装饰器
const shallowDecorator = createDecoratorForEnhancer(shallowEnhancer);
export const refDecorator = createDecoratorForEnhancer(referenceEnhancer);
const refStructDecorator = createDecoratorForEnhancer(refStructEnhancer);


function getEnhancerFromOptions(options) {
    return options.defaultDecorator
        ? options.defaultDecorator.enhancer
        : options.deep === false
            ? referenceEnhancer
            : deepEnhancer;
}
/**
 * Turns an object, array or function into a reactive structure.
 * 将对象、数组或函数转换为反应式结构。本身不提供转换功能
 * @param v the value which should become observable.
 * 
 * 策略设计模式：将多种数据类型（Object、Array、Map）情况的转换封装起来，好让调用者不需要关心实现细节
 * 
 */
function createObservable(v, arg2, arg3) {
    // @observable someProp;
    if (typeof arguments[1] === "string" || typeof arguments[1] === "symbol") {
        return deepDecorator.apply(null, arguments);
    }
    // 已经是一个observable对象了，直接返回
    if (isObservable(v))
        return v;
    // 根据类型 转给对应的方法处理
    // const res = isPlainObject(v)
    //     ? observable.object(v, arg2, arg3)
    //     : Array.isArray(v)
    //         ? observable.array(v, arg2)
    //         : isES6Map(v)
    //             ? observable.map(v, arg2)
    //             : isES6Set(v)
    //                 ? observable.set(v, arg2)
    //                 : v;

    let res;
    if(isPlainObject(v)){
        res = observable.object(v, arg2, arg3)
    }else if(Array.isArray(v)){
        res = observable.array(v, arg2)
    }else if(isES6Map(v)){
        res = observable.map(v, arg2)
    }else if(isES6Set(v)){
        res = observable.set(v, arg2)
    }else{
        res = v
    }
    // isPlainObject(v)
    //     ? observable.object(v, arg2, arg3)
    //     : Array.isArray(v)
    //         ? observable.array(v, arg2)
    //         : isES6Map(v)
    //             ? observable.map(v, arg2)
    //             : isES6Set(v)
    //                 ? observable.set(v, arg2)
    //                 : v;



    // this value could be converted to a new observable data structure, return it 这个值可以转换为一个新的可观察数据结构，返回它
    if (res !== v)
        return res;
    // otherwise, just box it
    fail(process.env.NODE_ENV !== "production" &&
        `The provided value could not be converted into an observable. If you want just create an observable reference to the object use 'observable.box(value)'`);
}
const observableFactories = {
    box(value, options) {
        if (arguments.length > 2)
            incorrectlyUsedAsDecorator("box");
            // 仅仅是格式化入参 options 对象而已
        const o = asCreateObservableOptions(options);
        return new ObservableValue(value, getEnhancerFromOptions(o), o.name, true, o.equals);
    },
    array(initialValues, options) {
        if (arguments.length > 2)
            incorrectlyUsedAsDecorator("array");
        const o = asCreateObservableOptions(options);
        return createObservableArray(initialValues, getEnhancerFromOptions(o), o.name);
    },
    map(initialValues, options) {
        if (arguments.length > 2)
            incorrectlyUsedAsDecorator("map");
        const o = asCreateObservableOptions(options);
        return new ObservableMap(initialValues, getEnhancerFromOptions(o), o.name);
    },
    set(initialValues, options) {
        if (arguments.length > 2)
            incorrectlyUsedAsDecorator("set");
        const o = asCreateObservableOptions(options);
        return new ObservableSet(initialValues, getEnhancerFromOptions(o), o.name);
    },
    object(props, decorators, options) {
        if (typeof arguments[1] === "string")
            incorrectlyUsedAsDecorator("object");
        const o = asCreateObservableOptions(options);
        if (o.proxy === false) {
            return extendObservable({}, props, decorators, o);
        }
        else {
            const defaultDecorator = getDefaultDecoratorFromObjectOptions(o);
            console.log(defaultDecorator)
            // 传一个空对象，进行新产物属性的初始化
            const base = extendObservable({}, undefined, undefined, o);
            console.log(base)
            // 创建动态的可观察对象
            const proxy = createDynamicObservableObject(base);
            console.log(proxy)
            extendObservableObjectWithProperties(proxy, props, decorators, defaultDecorator);
            return proxy;
        }
    },
    ref: refDecorator,
    shallow: shallowDecorator,
    deep: deepDecorator,
    struct: refStructDecorator
};
export const observable = createObservable;
// weird trick to keep our typings nicely with our funcs, and still extend the observable function
Object.keys(observableFactories).forEach(name => (observable[name] = observableFactories[name]));


function incorrectlyUsedAsDecorator(methodName) {
    fail(
    // process.env.NODE_ENV !== "production" &&
    `Expected one or two arguments to observable.${methodName}. Did you accidentally try to use observable.${methodName} as decorator?`);
}
