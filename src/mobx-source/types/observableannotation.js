import { getDescriptor, deepEnhancer, die, recordAnnotationApplied, objectPrototype } from "../internal";
export function createObservableAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_,
        extend_
    };
}
function make_(adm, key) {
    var _a, _b;
    let source = adm.target_;
    // Copy props from proto as well, see test:
    // "decorate should work with Object.create"
    while (source && source !== objectPrototype) {
        const descriptor = getDescriptor(source, key);
        if (descriptor) {
            assertObservableDescriptor(adm, this, key, descriptor);
            const definePropertyOutcome = adm.defineObservableProperty_(key, descriptor.value, (_b = (_a = this.options_) === null || _a === void 0 ? void 0 : _a.enhancer) !== null && _b !== void 0 ? _b : deepEnhancer);
            if (!definePropertyOutcome) {
                // Intercepted
                return;
            }
            recordAnnotationApplied(adm, this, key);
            return;
        }
        source = Object.getPrototypeOf(source);
    }
    if (!this.isDecorator_) {
        // Throw on missing key, except for decorators:
        // Decorator annotations are collected from whole prototype chain.
        // When called from super() some props may not exist yet.
        // However we don't have to worry about missing prop,
        // because the decorator must have been applied to something.
        die(1, this.annotationType_, `${adm.name_}.${key.toString()}`);
    }
}
function extend_(adm, key, descriptor, proxyTrap) {
    var _a, _b;
    assertObservableDescriptor(adm, this, key, descriptor);
    return adm.defineObservableProperty_(key, descriptor.value, (_b = (_a = this.options_) === null || _a === void 0 ? void 0 : _a.enhancer) !== null && _b !== void 0 ? _b : deepEnhancer, proxyTrap);
}
function assertObservableDescriptor(adm, { annotationType_ }, key, descriptor) {
    if (window.__DEV__ && !("value" in descriptor)) {
        die(`Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
            `\n'${annotationType_}' cannot be used on getter/setter properties`);
    }
}
