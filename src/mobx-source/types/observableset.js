var _a;
import { $mobx, createAtom, deepEnhancer, getNextId, isSpyEnabled, hasListeners, registerListener, spyReportStart, notifyListeners, spyReportEnd, createInstanceofPredicate, hasInterceptors, interceptChange, registerInterceptor, checkIfStateModificationsAreAllowed, untracked, makeIterable, transaction, isES6Set, DELETE, ADD, die, isFunction } from "../internal";
const ObservableSetMarker = {};
export class ObservableSet {
    constructor(initialData, enhancer = deepEnhancer, name_ = "ObservableSet@" + getNextId()) {
        this.name_ = name_;
        this[_a] = ObservableSetMarker;
        this.data_ = new Set();
        if (!isFunction(Set)) {
            die(22);
        }
        this.atom_ = createAtom(this.name_);
        this.enhancer_ = (newV, oldV) => enhancer(newV, oldV, name_);
        if (initialData) {
            this.replace(initialData);
        }
    }
    dehanceValue_(value) {
        if (this.dehancer !== undefined) {
            return this.dehancer(value);
        }
        return value;
    }
    clear() {
        transaction(() => {
            untracked(() => {
                for (const value of this.data_.values())
                    this.delete(value);
            });
        });
    }
    forEach(callbackFn, thisArg) {
        for (const value of this) {
            callbackFn.call(thisArg, value, value, this);
        }
    }
    get size() {
        this.atom_.reportObserved();
        return this.data_.size;
    }
    add(value) {
        checkIfStateModificationsAreAllowed(this.atom_);
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                type: ADD,
                object: this,
                newValue: value
            });
            if (!change)
                return this;
            // ideally, value = change.value would be done here, so that values can be
            // changed by interceptor. Same applies for other Set and Map api's.
        }
        if (!this.has(value)) {
            transaction(() => {
                this.data_.add(this.enhancer_(value, undefined));
                this.atom_.reportChanged();
            });
            const notifySpy = __DEV__ && isSpyEnabled();
            const notify = hasListeners(this);
            const change = notify || notifySpy
                ? {
                    observableKind: "set",
                    debugObjectName: this.name_,
                    type: ADD,
                    object: this,
                    newValue: value
                }
                : null;
            if (notifySpy && __DEV__)
                spyReportStart(change);
            if (notify)
                notifyListeners(this, change);
            if (notifySpy && __DEV__)
                spyReportEnd();
        }
        return this;
    }
    delete(value) {
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                type: DELETE,
                object: this,
                oldValue: value
            });
            if (!change)
                return false;
        }
        if (this.has(value)) {
            const notifySpy = __DEV__ && isSpyEnabled();
            const notify = hasListeners(this);
            const change = notify || notifySpy
                ? {
                    observableKind: "set",
                    debugObjectName: this.name_,
                    type: DELETE,
                    object: this,
                    oldValue: value
                }
                : null;
            if (notifySpy && __DEV__)
                spyReportStart(change);
            transaction(() => {
                this.atom_.reportChanged();
                this.data_.delete(value);
            });
            if (notify)
                notifyListeners(this, change);
            if (notifySpy && __DEV__)
                spyReportEnd();
            return true;
        }
        return false;
    }
    has(value) {
        this.atom_.reportObserved();
        return this.data_.has(this.dehanceValue_(value));
    }
    entries() {
        let nextIndex = 0;
        const keys = Array.from(this.keys());
        const values = Array.from(this.values());
        return makeIterable({
            next() {
                const index = nextIndex;
                nextIndex += 1;
                return index < values.length
                    ? { value: [keys[index], values[index]], done: false }
                    : { done: true };
            }
        });
    }
    keys() {
        return this.values();
    }
    values() {
        this.atom_.reportObserved();
        const self = this;
        let nextIndex = 0;
        const observableValues = Array.from(this.data_.values());
        return makeIterable({
            next() {
                return nextIndex < observableValues.length
                    ? { value: self.dehanceValue_(observableValues[nextIndex++]), done: false }
                    : { done: true };
            }
        });
    }
    replace(other) {
        if (isObservableSet(other)) {
            other = new Set(other);
        }
        transaction(() => {
            if (Array.isArray(other)) {
                this.clear();
                other.forEach(value => this.add(value));
            }
            else if (isES6Set(other)) {
                this.clear();
                other.forEach(value => this.add(value));
            }
            else if (other !== null && other !== undefined) {
                die("Cannot initialize set from " + other);
            }
        });
        return this;
    }
    observe_(listener, fireImmediately) {
        // ... 'fireImmediately' could also be true?
        if (__DEV__ && fireImmediately === true)
            die("`observe` doesn't support fireImmediately=true in combination with sets.");
        return registerListener(this, listener);
    }
    intercept_(handler) {
        return registerInterceptor(this, handler);
    }
    toJSON() {
        return Array.from(this);
    }
    toString() {
        return "[object ObservableSet]";
    }
    [(_a = $mobx, Symbol.iterator)]() {
        return this.values();
    }
    get [Symbol.toStringTag]() {
        return "Set";
    }
}
// eslint-disable-next-line
export var isObservableSet = createInstanceofPredicate("ObservableSet", ObservableSet);
