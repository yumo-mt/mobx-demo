import { once, untrackedEnd, untrackedStart, die } from "../internal";
export function hasInterceptors(interceptable) {
    return interceptable.interceptors_ !== undefined && interceptable.interceptors_.length > 0;
}
export function registerInterceptor(interceptable, handler) {
    const interceptors = interceptable.interceptors_ || (interceptable.interceptors_ = []);
    interceptors.push(handler);
    return once(() => {
        const idx = interceptors.indexOf(handler);
        if (idx !== -1)
            interceptors.splice(idx, 1);
    });
}
export function interceptChange(interceptable, change) {
    const prevU = untrackedStart();
    try {
        // Interceptor can modify the array, copy it to avoid concurrent modification, see #1950
        const interceptors = [...(interceptable.interceptors_ || [])];
        for (let i = 0, l = interceptors.length; i < l; i++) {
            change = interceptors[i](change);
            if (change && !change.type)
                die(14);
            if (!change)
                break;
        }
        return change;
    }
    finally {
        untrackedEnd(prevU);
    }
}
