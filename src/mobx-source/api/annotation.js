import { isGenerator, isFunction, autoAction, isAction, flow, computed, isFlow } from "../internal";
/**
 * Infers the best fitting annotation from property descriptor or false if the field shoudn't be annotated
 * - getter(+setter) -> computed
 * - setter w/o getter -> false (ignore)
 * - flow -> false (ignore)
 * - generator -> flow
 * - action -> false (ignore)
 * - function -> action (optionally bound)
 * - other -> defaultAnnotation
 */
export function inferAnnotationFromDescriptor(desc, defaultAnnotation, autoBind) {
    if (desc.get)
        return computed;
    if (desc.set)
        return false; // ignore lone setter
    // If already wrapped in action/flow, don't do that another time, but assume it is already set up properly.
    return isFunction(desc.value)
        ? isGenerator(desc.value)
            ? isFlow(desc.value)
                ? false
                : flow
            : isAction(desc.value)
                ? false
                : autoBind
                    ? autoAction.bound
                    : autoAction
        : defaultAnnotation;
}
export function isAnnotation(thing) {
    return (
    // Can be function
    thing instanceof Object &&
        typeof thing.annotationType_ === "string" &&
        isFunction(thing.make_) &&
        isFunction(thing.extend_));
}
export function isAnnotationMapEntry(thing) {
    return typeof thing === "boolean" || isAnnotation(thing);
}
