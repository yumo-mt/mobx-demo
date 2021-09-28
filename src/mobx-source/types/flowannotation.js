import { defineProperty, getDescriptor, objectPrototype, die, flow, isFlow, recordAnnotationApplied, isFunction, globalState } from "../internal";
export function createFlowAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_,
        extend_
    };
}
function make_(adm, key) {
    let annotated = false;
    let source = adm.target_;
    while (source && source !== objectPrototype) {
        const descriptor = getDescriptor(source, key);
        if (descriptor) {
            if (source !== adm.target_) {
                // Prototype
                if (isFlow(descriptor.value)) {
                    // A prototype could have been annotated already by other constructor,
                    // rest of the proto chain must be annotated already
                    annotated = true;
                    break;
                }
                const flowDescriptor = createFlowDescriptor(adm, this, key, descriptor);
                defineProperty(source, key, flowDescriptor);
            }
            else {
                const flowDescriptor = createFlowDescriptor(adm, this, key, descriptor);
                const definePropertyOutcome = adm.defineProperty_(key, flowDescriptor);
                if (!definePropertyOutcome) {
                    // Intercepted
                    return;
                }
            }
            annotated = true;
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
    const flowDescriptor = createFlowDescriptor(adm, this, key, descriptor);
    return adm.defineProperty_(key, flowDescriptor, proxyTrap);
}
function assertFlowDescriptor(adm, { annotationType_ }, key, { value }) {
    if (window.__DEV__ && !isFunction(value)) {
        die(`Cannot apply '${annotationType_}' to '${adm.name_}.${key.toString()}':` +
            `\n'${annotationType_}' can only be used on properties with a generator function value.`);
    }
}
function createFlowDescriptor(adm, annotation, key, descriptor) {
    assertFlowDescriptor(adm, annotation, key, descriptor);
    return {
        value: flow(descriptor.value),
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
