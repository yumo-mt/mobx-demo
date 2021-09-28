import { globalState, die } from "../internal";
// We shorten anything used > 5 times
export const assign = Object.assign;
export const getDescriptor = Object.getOwnPropertyDescriptor;
export const defineProperty = Object.defineProperty;
export const objectPrototype = Object.prototype;
export const EMPTY_ARRAY = [];
Object.freeze(EMPTY_ARRAY);
export const EMPTY_OBJECT = {};
Object.freeze(EMPTY_OBJECT);
const hasProxy = typeof Proxy !== "undefined";
const plainObjectString = Object.toString();
export function assertProxies() {
    if (!hasProxy) {
        die(window.__DEV__
            ? "`Proxy` objects are not available in the current environment. Please configure MobX to enable a fallback implementation.`"
            : "Proxy not available");
    }
}
export function warnAboutProxyRequirement(msg) {
    if (window.__DEV__ && globalState.verifyProxies) {
        die("MobX is currently configured to be able to run in ES5 mode, but in ES5 MobX won't be able to " +
            msg);
    }
}
export function getNextId() {
    return ++globalState.mobxGuid;
}
/**
 * Makes sure that the provided function is invoked at most once.
 */
export function once(func) {
    let invoked = false;
    return function () {
        if (invoked)
            return;
        invoked = true;
        return func.apply(this, arguments);
    };
}
export const noop = () => { };
export function isFunction(fn) {
    return typeof fn === "function";
}
export function isString(value) {
    return typeof value === "string";
}
export function isStringish(value) {
    const t = typeof value;
    switch (t) {
        case "string":
        case "symbol":
        case "number":
            return true;
    }
    return false;
}
export function isObject(value) {
    return value !== null && typeof value === "object";
}
export function isPlainObject(value) {
    var _a;
    if (!isObject(value))
        return false;
    const proto = Object.getPrototypeOf(value);
    if (proto == null)
        return true;
    return ((_a = proto.constructor) === null || _a === void 0 ? void 0 : _a.toString()) === plainObjectString;
}
// https://stackoverflow.com/a/37865170
export function isGenerator(obj) {
    const constructor = obj === null || obj === void 0 ? void 0 : obj.constructor;
    if (!constructor)
        return false;
    if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName)
        return true;
    return false;
}
export function addHiddenProp(object, propName, value) {
    defineProperty(object, propName, {
        enumerable: false,
        writable: true,
        configurable: true,
        value
    });
}
export function addHiddenFinalProp(object, propName, value) {
    defineProperty(object, propName, {
        enumerable: false,
        writable: false,
        configurable: true,
        value
    });
}
export function createInstanceofPredicate(name, theClass) {
    const propName = "isMobX" + name;
    theClass.prototype[propName] = true;
    return function (x) {
        return isObject(x) && x[propName] === true;
    };
}
export function isES6Map(thing) {
    return thing instanceof Map;
}
export function isES6Set(thing) {
    return thing instanceof Set;
}
const hasGetOwnPropertySymbols = typeof Object.getOwnPropertySymbols !== "undefined";
/**
 * Returns the following: own enumerable keys and symbols.
 */
export function getPlainObjectKeys(object) {
    const keys = Object.keys(object);
    // Not supported in IE, so there are not going to be symbol props anyway...
    if (!hasGetOwnPropertySymbols)
        return keys;
    const symbols = Object.getOwnPropertySymbols(object);
    if (!symbols.length)
        return keys;
    return [...keys, ...symbols.filter(s => objectPrototype.propertyIsEnumerable.call(object, s))];
}
// From Immer utils
// Returns all own keys, including non-enumerable and symbolic
export const ownKeys = typeof Reflect !== "undefined" && Reflect.ownKeys
    ? Reflect.ownKeys
    : hasGetOwnPropertySymbols
        ? obj => Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj))
        : /* istanbul ignore next */ Object.getOwnPropertyNames;
export function stringifyKey(key) {
    if (typeof key === "string")
        return key;
    if (typeof key === "symbol")
        return key.toString();
    return new String(key).toString();
}
export function toPrimitive(value) {
    return value === null ? null : typeof value === "object" ? "" + value : value;
}
export function hasProp(target, prop) {
    return objectPrototype.hasOwnProperty.call(target, prop);
}
// From Immer utils
export const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
    function getOwnPropertyDescriptors(target) {
        // Polyfill needed for Hermes and IE, see https://github.com/facebook/hermes/issues/274
        const res = {};
        // Note: without polyfill for ownKeys, symbols won't be picked up
        ownKeys(target).forEach(key => {
            res[key] = getDescriptor(target, key);
        });
        return res;
    };
