import { getAnnotationFromOptions, propagateChanged, isAnnotation, $mobx, Atom, ComputedValue, ObservableValue, addHiddenProp, createInstanceofPredicate, endBatch, getNextId, hasInterceptors, hasListeners, interceptChange, isObject, isPlainObject, isSpyEnabled, notifyListeners, referenceEnhancer, registerInterceptor, registerListener, spyReportEnd, spyReportStart, startBatch, stringifyKey, globalState, observable, ADD, UPDATE, die, hasProp, getDescriptor, storedAnnotationsSymbol, ownKeys, isOverride, defineProperty, inferAnnotationFromDescriptor, objectPrototype } from "../internal";
// adm[inferredAnnotationsSymbol] = { foo: annotation, ... }
export const inferredAnnotationsSymbol = Symbol("mobx-inferred-annotations");
const descriptorCache = Object.create(null);
const REMOVE = "remove";
export class ObservableObjectAdministration {
    constructor(target_, values_ = new Map(), name_, 
    // Used anytime annotation is not explicitely provided
    defaultAnnotation_ = observable, 
    // Bind automatically inferred actions?
    autoBind_ = false) {
        this.target_ = target_;
        this.values_ = values_;
        this.name_ = name_;
        this.defaultAnnotation_ = defaultAnnotation_;
        this.autoBind_ = autoBind_;
        this.keysAtom_ = new Atom(name_ + ".keys");
        // Optimization: we use this frequently
        this.isPlainObject_ = isPlainObject(this.target_);
        if (window.__DEV__ && !isAnnotation(this.defaultAnnotation_)) {
            die(`defaultAnnotation must be valid annotation`);
        }
        if (window.__DEV__ && typeof this.autoBind_ !== "boolean") {
            die(`autoBind must be boolean`);
        }
        if (window.__DEV__) {
            // Prepare structure for tracking which fields were already annotated
            this.appliedAnnotations_ = {};
        }
    }
    getObservablePropValue_(key) {
        return this.values_.get(key).get();
    }
    setObservablePropValue_(key, newValue) {
        const observable = this.values_.get(key);
        if (observable instanceof ComputedValue) {
            observable.set(newValue);
            return true;
        }
        // intercept
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                type: UPDATE,
                object: this.proxy_ || this.target_,
                name: key,
                newValue
            });
            if (!change)
                return null;
            newValue = change.newValue;
        }
        newValue = observable.prepareNewValue_(newValue);
        // notify spy & observers
        if (newValue !== globalState.UNCHANGED) {
            const notify = hasListeners(this);
            const notifySpy = window.__DEV__ && isSpyEnabled();
            const change = notify || notifySpy
                ? {
                    type: UPDATE,
                    observableKind: "object",
                    debugObjectName: this.name_,
                    object: this.proxy_ || this.target_,
                    oldValue: observable.value_,
                    name: key,
                    newValue
                }
                : null;
            if (window.__DEV__ && notifySpy)
                spyReportStart(change);
            observable.setNewValue_(newValue);
            if (notify)
                notifyListeners(this, change);
            if (window.__DEV__ && notifySpy)
                spyReportEnd();
        }
        return true;
    }
    get_(key) {
        if (globalState.trackingDerivation && !hasProp(this.target_, key)) {
            // Key doesn't exist yet, subscribe for it in case it's added later
            this.has_(key);
        }
        return this.target_[key];
    }
    /**
     * @param {PropertyKey} key
     * @param {any} value
     * @param {Annotation|boolean} annotation true - infer from descriptor, false - copy as is
     * @param {boolean} proxyTrap whether it's called from proxy trap
     * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
     */
    set_(key, value, proxyTrap = false) {
        // Don't use .has(key) - we care about own
        if (hasProp(this.target_, key)) {
            // Existing prop
            if (this.values_.has(key)) {
                // Observable (can be intercepted)
                return this.setObservablePropValue_(key, value);
            }
            else if (proxyTrap) {
                // Non-observable - proxy
                return Reflect.set(this.target_, key, value);
            }
            else {
                // Non-observable
                this.target_[key] = value;
                return true;
            }
        }
        else {
            // New prop
            return this.extend_(key, { value, enumerable: true, writable: true, configurable: true }, this.defaultAnnotation_, proxyTrap);
        }
    }
    // Trap for "in"
    has_(key) {
        if (!globalState.trackingDerivation) {
            // Skip key subscription outside derivation
            return key in this.target_;
        }
        this.pendingKeys_ || (this.pendingKeys_ = new Map());
        let entry = this.pendingKeys_.get(key);
        if (!entry) {
            entry = new ObservableValue(key in this.target_, referenceEnhancer, `${this.name_}.${stringifyKey(key)}?`, false);
            this.pendingKeys_.set(key, entry);
        }
        return entry.get();
    }
    /**
     * @param {PropertyKey} key
     * @param {Annotation|boolean} annotation true - infer from object or it's prototype, false - ignore
     */
    make_(key, annotation) {
        if (annotation === true) {
            annotation = this.inferAnnotation_(key);
        }
        if (annotation === false) {
            return;
        }
        assertAnnotable(this, annotation, key);
        annotation.make_(this, key);
    }
    /**
     * @param {PropertyKey} key
     * @param {PropertyDescriptor} descriptor
     * @param {Annotation|boolean} annotation true - infer from descriptor, false - copy as is
     * @param {boolean} proxyTrap whether it's called from proxy trap
     * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
     */
    extend_(key, descriptor, annotation, proxyTrap = false) {
        if (annotation === true) {
            annotation = inferAnnotationFromDescriptor(descriptor, this.defaultAnnotation_, this.autoBind_);
        }
        if (annotation === false) {
            return this.defineProperty_(key, descriptor, proxyTrap);
        }
        assertAnnotable(this, annotation, key);
        const outcome = annotation.extend_(this, key, descriptor, proxyTrap);
        if (outcome) {
            recordAnnotationApplied(this, annotation, key);
        }
        return outcome;
    }
    inferAnnotation_(key) {
        var _a;
        // Inherited is fine - annotation cannot differ in subclass
        let annotation = (_a = this.target_[inferredAnnotationsSymbol]) === null || _a === void 0 ? void 0 : _a[key];
        if (annotation)
            return annotation;
        let current = this.target_;
        while (current && current !== objectPrototype) {
            const descriptor = getDescriptor(current, key);
            if (descriptor) {
                annotation = inferAnnotationFromDescriptor(descriptor, this.defaultAnnotation_, this.autoBind_);
                break;
            }
            current = Object.getPrototypeOf(current);
        }
        // Not found (false means ignore)
        if (annotation === undefined) {
            die(1, "true", key);
        }
        // Cache the annotation.
        // Note we can do this only because annotation and field can't change.
        if (!this.isPlainObject_) {
            // We could also place it on furthest proto, shoudn't matter
            const closestProto = Object.getPrototypeOf(this.target_);
            if (!hasProp(closestProto, inferredAnnotationsSymbol)) {
                addHiddenProp(closestProto, inferredAnnotationsSymbol, {});
            }
            closestProto[inferredAnnotationsSymbol][key] = annotation;
        }
        return annotation;
    }
    /**
     * @param {PropertyKey} key
     * @param {PropertyDescriptor} descriptor
     * @param {boolean} proxyTrap whether it's called from proxy trap
     * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
     */
    defineProperty_(key, descriptor, proxyTrap = false) {
        try {
            startBatch();
            // Delete
            const deleteOutcome = this.delete_(key);
            if (!deleteOutcome) {
                // Failure or intercepted
                return deleteOutcome;
            }
            // ADD interceptor
            if (hasInterceptors(this)) {
                const change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: descriptor.value
                });
                if (!change)
                    return null;
                const { newValue } = change;
                if (descriptor.value !== newValue) {
                    descriptor = Object.assign(Object.assign({}, descriptor), { value: newValue });
                }
            }
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) {
                    return false;
                }
            }
            else {
                defineProperty(this.target_, key, descriptor);
            }
            // Notify
            this.notifyPropertyAddition_(key, descriptor.value);
        }
        finally {
            endBatch();
        }
        return true;
    }
    // If original descriptor becomes relevant, move this to annotation directly
    defineObservableProperty_(key, value, enhancer, proxyTrap = false) {
        try {
            startBatch();
            // Delete
            const deleteOutcome = this.delete_(key);
            if (!deleteOutcome) {
                // Failure or intercepted
                return deleteOutcome;
            }
            // ADD interceptor
            if (hasInterceptors(this)) {
                const change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: value
                });
                if (!change)
                    return null;
                value = change.newValue;
            }
            const cachedDescriptor = getCachedObservablePropDescriptor(key);
            const descriptor = {
                configurable: globalState.safeDescriptors ? this.isPlainObject_ : true,
                enumerable: true,
                get: cachedDescriptor.get,
                set: cachedDescriptor.set
            };
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) {
                    return false;
                }
            }
            else {
                defineProperty(this.target_, key, descriptor);
            }
            const observable = new ObservableValue(value, enhancer, `${this.name_}.${stringifyKey(key)}`, false);
            this.values_.set(key, observable);
            // Notify (value possibly changed by ObservableValue)
            this.notifyPropertyAddition_(key, observable.value_);
        }
        finally {
            endBatch();
        }
        return true;
    }
    // If original descriptor becomes relevant, move this to annotation directly
    defineComputedProperty_(key, options, proxyTrap = false) {
        try {
            startBatch();
            // Delete
            const deleteOutcome = this.delete_(key);
            if (!deleteOutcome) {
                // Failure or intercepted
                return deleteOutcome;
            }
            // ADD interceptor
            if (hasInterceptors(this)) {
                const change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: undefined
                });
                if (!change)
                    return null;
            }
            options.name || (options.name = `${this.name_}.${stringifyKey(key)}`);
            options.context = this.proxy_ || this.target_;
            const cachedDescriptor = getCachedObservablePropDescriptor(key);
            const descriptor = {
                configurable: globalState.safeDescriptors ? this.isPlainObject_ : true,
                enumerable: false,
                get: cachedDescriptor.get,
                set: cachedDescriptor.set
            };
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) {
                    return false;
                }
            }
            else {
                defineProperty(this.target_, key, descriptor);
            }
            this.values_.set(key, new ComputedValue(options));
            // Notify
            this.notifyPropertyAddition_(key, undefined);
        }
        finally {
            endBatch();
        }
        return true;
    }
    /**
     * @param {PropertyKey} key
     * @param {PropertyDescriptor} descriptor
     * @param {boolean} proxyTrap whether it's called from proxy trap
     * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
     */
    delete_(key, proxyTrap = false) {
        var _a, _b, _c;
        // No such prop
        if (!hasProp(this.target_, key)) {
            return true;
        }
        // Intercept
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                object: this.proxy_ || this.target_,
                name: key,
                type: REMOVE
            });
            // Cancelled
            if (!change)
                return null;
        }
        // Delete
        try {
            startBatch();
            const notify = hasListeners(this);
            const notifySpy = window.__DEV__ && isSpyEnabled();
            const observable = this.values_.get(key);
            // Value needed for spies/listeners
            let value = undefined;
            // Optimization: don't pull the value unless we will need it
            if (!observable && (notify || notifySpy)) {
                value = (_a = getDescriptor(this.target_, key)) === null || _a === void 0 ? void 0 : _a.value;
            }
            // delete prop (do first, may fail)
            if (proxyTrap) {
                if (!Reflect.deleteProperty(this.target_, key)) {
                    return false;
                }
            }
            else {
                delete this.target_[key];
            }
            // Allow re-annotating this field
            if (window.__DEV__) {
                delete this.appliedAnnotations_[key];
            }
            // Clear observable
            if (observable) {
                this.values_.delete(key);
                // for computed, value is undefined
                if (observable instanceof ObservableValue) {
                    value = observable.value_;
                }
                // Notify: autorun(() => obj[key]), see #1796
                propagateChanged(observable);
            }
            // Notify "keys/entries/values" observers
            this.keysAtom_.reportChanged();
            // Notify "has" observers
            // "in" as it may still exist in proto
            (_c = (_b = this.pendingKeys_) === null || _b === void 0 ? void 0 : _b.get(key)) === null || _c === void 0 ? void 0 : _c.set(key in this.target_);
            // Notify spies/listeners
            if (notify || notifySpy) {
                const change = {
                    type: REMOVE,
                    observableKind: "object",
                    object: this.proxy_ || this.target_,
                    debugObjectName: this.name_,
                    oldValue: value,
                    name: key
                };
                if (window.__DEV__ && notifySpy)
                    spyReportStart(change);
                if (notify)
                    notifyListeners(this, change);
                if (window.__DEV__ && notifySpy)
                    spyReportEnd();
            }
        }
        finally {
            endBatch();
        }
        return true;
    }
    /**
     * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
     * for callback details
     */
    observe_(callback, fireImmediately) {
        if (window.__DEV__ && fireImmediately === true)
            die("`observe` doesn't support the fire immediately property for observable objects.");
        return registerListener(this, callback);
    }
    intercept_(handler) {
        return registerInterceptor(this, handler);
    }
    notifyPropertyAddition_(key, value) {
        var _a, _b;
        const notify = hasListeners(this);
        const notifySpy = window.__DEV__ && isSpyEnabled();
        if (notify || notifySpy) {
            const change = notify || notifySpy
                ? {
                    type: ADD,
                    observableKind: "object",
                    debugObjectName: this.name_,
                    object: this.proxy_ || this.target_,
                    name: key,
                    newValue: value
                }
                : null;
            if (window.__DEV__ && notifySpy)
                spyReportStart(change);
            if (notify)
                notifyListeners(this, change);
            if (window.__DEV__ && notifySpy)
                spyReportEnd();
        }
        (_b = (_a = this.pendingKeys_) === null || _a === void 0 ? void 0 : _a.get(key)) === null || _b === void 0 ? void 0 : _b.set(true);
        // Notify "keys/entries/values" observers
        this.keysAtom_.reportChanged();
    }
    ownKeys_() {
        this.keysAtom_.reportObserved();
        return ownKeys(this.target_);
    }
    keys_() {
        // Returns enumerable && own, but unfortunately keysAtom will report on ANY key change.
        // There is no way to distinguish between Object.keys(object) and Reflect.ownKeys(object) - both are handled by ownKeys trap.
        // We can either over-report in Object.keys(object) or under-report in Reflect.ownKeys(object)
        // We choose to over-report in Object.keys(object), because:
        // - typically it's used with simple data objects
        // - when symbolic/non-enumerable keys are relevant Reflect.ownKeys works as expected
        this.keysAtom_.reportObserved();
        return Object.keys(this.target_);
    }
}
export function asObservableObject(target, options) {
    var _a;
    if (window.__DEV__ && options && isObservableObject(target)) {
        die(`Options can't be provided for already observable objects.`);
    }
    if (hasProp(target, $mobx))
        return target;
    if (window.__DEV__ && !Object.isExtensible(target))
        die("Cannot make the designated object observable; it is not extensible");
    const name = (_a = options === null || options === void 0 ? void 0 : options.name) !== null && _a !== void 0 ? _a : `${isPlainObject(target) ? "ObservableObject" : target.constructor.name}@${getNextId()}`;
    const adm = new ObservableObjectAdministration(target, new Map(), stringifyKey(name), getAnnotationFromOptions(options), options === null || options === void 0 ? void 0 : options.autoBind);
    addHiddenProp(target, $mobx, adm);
    return target;
}
const isObservableObjectAdministration = createInstanceofPredicate("ObservableObjectAdministration", ObservableObjectAdministration);
function getCachedObservablePropDescriptor(key) {
    return (descriptorCache[key] ||
        (descriptorCache[key] = {
            get() {
                return this[$mobx].getObservablePropValue_(key);
            },
            set(value) {
                return this[$mobx].setObservablePropValue_(key, value);
            }
        }));
}
export function isObservableObject(thing) {
    if (isObject(thing)) {
        return isObservableObjectAdministration(thing[$mobx]);
    }
    return false;
}
export function recordAnnotationApplied(adm, annotation, key) {
    if (window.__DEV__) {
        adm.appliedAnnotations_[key] = annotation;
    }
    // Remove applied decorator annotation so we don't try to apply it again in subclass constructor
    if (annotation.isDecorator_) {
        delete adm.target_[storedAnnotationsSymbol][key];
    }
}
function assertAnnotable(adm, annotation, key) {
    // Valid annotation
    if (window.__DEV__ && !isAnnotation(annotation)) {
        die(`Cannot annotate '${adm.name_}.${key.toString()}': Invalid annotation.`);
    }
    /*
    // Configurable, not sealed, not frozen
    // Possibly not needed, just a little better error then the one thrown by engine.
    // Cases where this would be useful the most (subclass field initializer) are not interceptable by this.
    if (window.__DEV__) {
        const configurable = getDescriptor(adm.target_, key)?.configurable
        const frozen = Object.isFrozen(adm.target_)
        const sealed = Object.isSealed(adm.target_)
        if (!configurable || frozen || sealed) {
            const fieldName = `${adm.name_}.${key.toString()}`
            const requestedAnnotationType = annotation.annotationType_
            let error = `Cannot apply '${requestedAnnotationType}' to '${fieldName}':`
            if (frozen) {
                error += `\nObject is frozen.`
            }
            if (sealed) {
                error += `\nObject is sealed.`
            }
            if (!configurable) {
                error += `\nproperty is not configurable.`
                // Mention only if caused by us to avoid confusion
                if (hasProp(adm.appliedAnnotations!, key)) {
                    error += `\nTo prevent accidental re-definition of a field by a subclass, `
                    error += `all annotated fields of non-plain objects (classes) are not configurable.`
                }
            }
            die(error)
        }
    }
    */
    // Not annotated
    if (window.__DEV__ && !isOverride(annotation) && hasProp(adm.appliedAnnotations_, key)) {
        const fieldName = `${adm.name_}.${key.toString()}`;
        const currentAnnotationType = adm.appliedAnnotations_[key].annotationType_;
        const requestedAnnotationType = annotation.annotationType_;
        die(`Cannot apply '${requestedAnnotationType}' to '${fieldName}':` +
            `\nThe field is already annotated with '${currentAnnotationType}'.` +
            `\nRe-annotating fields is not allowed.` +
            `\nUse 'override' annotation for methods overriden by subclass.`);
    }
}
