import { $mobx, warnAboutProxyRequirement, assertProxies, die, isStringish, globalState, asObservableObject } from "../internal";
function getAdm(target) {
    return target[$mobx];
}
// Optimization: we don't need the intermediate objects and could have a completely custom administration for DynamicObjects,
// and skip either the internal values map, or the base object with its property descriptors!
const objectProxyTraps = {
    has(target, name) {
        if (__DEV__ && globalState.trackingDerivation)
            warnAboutProxyRequirement("detect new properties using the 'in' operator. Use 'has' from 'mobx' instead.");
        return getAdm(target).has_(name);
    },
    get(target, name) {
        return getAdm(target).get_(name);
    },
    set(target, name, value) {
        var _a;
        if (!isStringish(name))
            return false;
        if (__DEV__ && !getAdm(target).values_.has(name)) {
            warnAboutProxyRequirement("add a new observable property through direct assignment. Use 'set' from 'mobx' instead.");
        }
        // null (intercepted) -> true (success)
        return (_a = getAdm(target).set_(name, value, true)) !== null && _a !== void 0 ? _a : true;
    },
    deleteProperty(target, name) {
        var _a;
        if (__DEV__) {
            warnAboutProxyRequirement("delete properties from an observable object. Use 'remove' from 'mobx' instead.");
        }
        if (!isStringish(name))
            return false;
        // null (intercepted) -> true (success)
        return (_a = getAdm(target).delete_(name, true)) !== null && _a !== void 0 ? _a : true;
    },
    defineProperty(target, name, descriptor) {
        var _a;
        if (__DEV__) {
            warnAboutProxyRequirement("define property on an observable object. Use 'defineProperty' from 'mobx' instead.");
        }
        // null (intercepted) -> true (success)
        return (_a = getAdm(target).defineProperty_(name, descriptor)) !== null && _a !== void 0 ? _a : true;
    },
    ownKeys(target) {
        if (__DEV__ && globalState.trackingDerivation)
            warnAboutProxyRequirement("iterate keys to detect added / removed properties. Use `keys` from 'mobx' instead.");
        return getAdm(target).ownKeys_();
    },
    preventExtensions(target) {
        die(13);
    }
};
export function asDynamicObservableObject(target, options) {
    var _a;
    var _b;
    assertProxies();
    target = asObservableObject(target, options);
    return ((_a = (_b = target[$mobx]).proxy_) !== null && _a !== void 0 ? _a : (_b.proxy_ = new Proxy(target, objectProxyTraps)));
}
