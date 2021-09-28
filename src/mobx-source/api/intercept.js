import { getAdministration, isFunction } from "../internal";
export function intercept(thing, propOrHandler, handler) {
    if (isFunction(handler))
        return interceptProperty(thing, propOrHandler, handler);
    else
        return interceptInterceptable(thing, propOrHandler);
}
function interceptInterceptable(thing, handler) {
    return getAdministration(thing).intercept_(handler);
}
function interceptProperty(thing, property, handler) {
    return getAdministration(thing, property).intercept_(handler);
}
