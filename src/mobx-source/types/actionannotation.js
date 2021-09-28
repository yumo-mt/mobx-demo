import { createAction, isAction, defineProperty, getDescriptor, objectPrototype, die, isFunction, recordAnnotationApplied, globalState } from "../internal";
export function createActionAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_,
        extend_
    };
}
function make_(adm, key) {
    var _a, _b;
    let annotated = false;
    let source = adm.target_;
    let bound = (_b = (_a = this.options_) === null || _a === void 0 ? void 0 : _a.bound) !== null && _b !== void 0 ? _b : false;
    while (source && source !== objectPrototype) {
        const descriptor = getDescriptor(source, key);
        if (descriptor) {
            // Instance or bound
            // Keep first because the operation can be intercepted
            // and we don't want to end up with partially annotated proto chain
            if (source === adm.target_ || bound) {
                const actionDescriptor = createActionDescriptor(adm, this, key, descriptor);
                const definePropertyOutcome = adm.defineProperty_(key, actionDescriptor);
                if (!definePropertyOutcome) {
                    // Intercepted
                    return;
                }
                annotated = true;
                // Don't annotate protos if bound
                if (bound) {
                    break;
                }
            }
            // Prototype
            if (source !== adm.target_) {
                if (isAction(descriptor.value)) {
                    // A prototype could have been annotated already by other constructor,
                    // rest of the proto chain must be annotated already
                    annotated = true;
                    break;
                }
                const actionDescriptor = createActionDescriptor(adm, this, key, descriptor);
                defineProperty(source, key, actionDescriptor);
                annotated = true;
            }
        }
        source = Object.getPrototypeOf(source);
    }
    if (annotated) {
        recordAnnotationApplied(adm, this, key);
    }
    else if (!this.isDecorator_) {
        // Throw on missing key, except for decorators:
        // Decorator annotations are collected from whole prototype chain.
        // When called from super() some props may not exist yet.
        // However we don't have to worry about missing prop,
        // because the decorator must have been applied to something.
        die(1, this.annotationType_, `${adm.name_}.${key.toString()}`);
    }
}
function extend_(adm, key, descriptor, proxyTrap) {
    const actionDescriptor = createActionDescriptor(adm, this, key, descriptor);
    return adm.defineProperty_(key, actionDescriptor, proxyTrap);
}
function assertActionDescriptor(adm, { annotationType_ }, key, { value }) {
    if (__DEV__ && !isFunction(value)) {
        die(`Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
            `\n'${annotationType_}' can only be used on properties with a function value.`);
    }
}
function createActionDescriptor(adm, annotation, key, descriptor) {
    var _a, _b, _c, _d, _e, _f;
    assertActionDescriptor(adm, annotation, key, descriptor);
    let { value } = descriptor;
    if ((_a = annotation.options_) === null || _a === void 0 ? void 0 : _a.bound) {
        value = value.bind((_b = adm.proxy_) !== null && _b !== void 0 ? _b : adm.target_);
    }
    return {
        value: createAction((_d = (_c = annotation.options_) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : key.toString(), value, (_f = (_e = annotation.options_) === null || _e === void 0 ? void 0 : _e.autoAction) !== null && _f !== void 0 ? _f : false),
        // Non-configurable for classes
        // prevents accidental field redefinition in subclass
        configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
        // https://github.com/mobxjs/mobx/pull/2641#issuecomment-737292058
        enumerable: false,
        // Non-obsevable, therefore non-writable
        // Also prevents rewriting in subclass constructor
        writable: globalState.safeDescriptors ? false : true
    };
}
