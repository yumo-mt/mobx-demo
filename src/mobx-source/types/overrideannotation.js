import { die, hasProp, createDecoratorAnnotation } from "../internal";
const OVERRIDE = "override";
export const override = createDecoratorAnnotation({
    annotationType_: OVERRIDE,
    make_,
    extend_
});
export function isOverride(annotation) {
    return annotation.annotationType_ === OVERRIDE;
}
function make_(adm, key) {
    // Must not be plain object
    if (window.__DEV__ && adm.isPlainObject_) {
        die(`Cannot apply '${this.annotationType_}' to '${adm.name_}.${key.toString()}':` +
            `\n'${this.annotationType_}' cannot be used on plain objects.`);
    }
    // Must override something
    if (window.__DEV__ && !hasProp(adm.appliedAnnotations_, key)) {
        die(`'${adm.name_}.${key.toString()}' is annotated with '${this.annotationType_}', ` +
            `but no such annotated member was found on prototype.`);
    }
}
function extend_(adm, key, descriptor, proxyTrap) {
    die(`'${this.annotationType_}' can only be used with 'makeObservable'`);
}
