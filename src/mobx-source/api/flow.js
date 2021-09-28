import { action, noop, die, isFunction, isStringish, storeAnnotation, createFlowAnnotation } from "../internal";
export const FLOW = "flow";
let generatorId = 0;
export function FlowCancellationError() {
    this.message = "FLOW_CANCELLED";
}
FlowCancellationError.prototype = Object.create(Error.prototype);
export function isFlowCancellationError(error) {
    return error instanceof FlowCancellationError;
}
const flowAnnotation = createFlowAnnotation("flow");
export const flow = Object.assign(function flow(arg1, arg2) {
    // @flow
    if (isStringish(arg2)) {
        return storeAnnotation(arg1, arg2, flowAnnotation);
    }
    // flow(fn)
    if (__DEV__ && arguments.length !== 1)
        die(`Flow expects single argument with generator function`);
    const generator = arg1;
    const name = generator.name || "<unnamed flow>";
    // Implementation based on https://github.com/tj/co/blob/master/index.js
    const res = function () {
        const ctx = this;
        const args = arguments;
        const runId = ++generatorId;
        const gen = action(`${name} - runid: ${runId} - init`, generator).apply(ctx, args);
        let rejector;
        let pendingPromise = undefined;
        const promise = new Promise(function (resolve, reject) {
            let stepId = 0;
            rejector = reject;
            function onFulfilled(res) {
                pendingPromise = undefined;
                let ret;
                try {
                    ret = action(`${name} - runid: ${runId} - yield ${stepId++}`, gen.next).call(gen, res);
                }
                catch (e) {
                    return reject(e);
                }
                next(ret);
            }
            function onRejected(err) {
                pendingPromise = undefined;
                let ret;
                try {
                    ret = action(`${name} - runid: ${runId} - yield ${stepId++}`, gen.throw).call(gen, err);
                }
                catch (e) {
                    return reject(e);
                }
                next(ret);
            }
            function next(ret) {
                if (isFunction(ret === null || ret === void 0 ? void 0 : ret.then)) {
                    // an async iterator
                    ret.then(next, reject);
                    return;
                }
                if (ret.done)
                    return resolve(ret.value);
                pendingPromise = Promise.resolve(ret.value);
                return pendingPromise.then(onFulfilled, onRejected);
            }
            onFulfilled(undefined); // kick off the process
        });
        promise.cancel = action(`${name} - runid: ${runId} - cancel`, function () {
            try {
                if (pendingPromise)
                    cancelPromise(pendingPromise);
                // Finally block can return (or yield) stuff..
                const res = gen.return(undefined);
                // eat anything that promise would do, it's cancelled!
                const yieldedPromise = Promise.resolve(res.value);
                yieldedPromise.then(noop, noop);
                cancelPromise(yieldedPromise); // maybe it can be cancelled :)
                // reject our original promise
                rejector(new FlowCancellationError());
            }
            catch (e) {
                rejector(e); // there could be a throwing finally block
            }
        });
        return promise;
    };
    res.isMobXFlow = true;
    return res;
}, flowAnnotation);
function cancelPromise(promise) {
    if (isFunction(promise.cancel))
        promise.cancel();
}
export function flowResult(result) {
    return result; // just tricking TypeScript :)
}
export function isFlow(fn) {
    return (fn === null || fn === void 0 ? void 0 : fn.isMobXFlow) === true;
}
