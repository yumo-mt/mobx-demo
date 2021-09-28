import { Atom, checkIfStateModificationsAreAllowed, comparer, createInstanceofPredicate, getNextId, hasInterceptors, hasListeners, interceptChange, isSpyEnabled, notifyListeners, registerInterceptor, registerListener, spyReport, spyReportEnd, spyReportStart, toPrimitive, globalState, UPDATE } from "../internal";
const CREATE = "create";
export class ObservableValue extends Atom {
    constructor(value, enhancer, name_ = "ObservableValue@" + getNextId(), notifySpy = true, equals = comparer.default) {
        super(name_);
        this.enhancer = enhancer;
        this.name_ = name_;
        this.equals = equals;
        this.hasUnreportedChange_ = false;
        this.value_ = enhancer(value, undefined, name_);
        if (window.__DEV__ && notifySpy && isSpyEnabled()) {
            // only notify spy if this is a stand-alone observable
            spyReport({
                type: CREATE,
                object: this,
                observableKind: "value",
                debugObjectName: this.name_,
                newValue: "" + this.value_
            });
        }
    }
    dehanceValue(value) {
        if (this.dehancer !== undefined)
            return this.dehancer(value);
        return value;
    }
    set(newValue) {
        const oldValue = this.value_;
        newValue = this.prepareNewValue_(newValue);
        if (newValue !== globalState.UNCHANGED) {
            const notifySpy = isSpyEnabled();
            if (window.__DEV__ && notifySpy) {
                spyReportStart({
                    type: UPDATE,
                    object: this,
                    observableKind: "value",
                    debugObjectName: this.name_,
                    newValue,
                    oldValue
                });
            }
            this.setNewValue_(newValue);
            if (window.__DEV__ && notifySpy)
                spyReportEnd();
        }
    }
    prepareNewValue_(newValue) {
        checkIfStateModificationsAreAllowed(this);
        if (hasInterceptors(this)) {
            const change = interceptChange(this, {
                object: this,
                type: UPDATE,
                newValue
            });
            if (!change)
                return globalState.UNCHANGED;
            newValue = change.newValue;
        }
        // apply modifier
        newValue = this.enhancer(newValue, this.value_, this.name_);
        return this.equals(this.value_, newValue) ? globalState.UNCHANGED : newValue;
    }
    setNewValue_(newValue) {
        const oldValue = this.value_;
        this.value_ = newValue;
        this.reportChanged();
        if (hasListeners(this)) {
            notifyListeners(this, {
                type: UPDATE,
                object: this,
                newValue,
                oldValue
            });
        }
    }
    get() {
        this.reportObserved();
        return this.dehanceValue(this.value_);
    }
    intercept_(handler) {
        return registerInterceptor(this, handler);
    }
    observe_(listener, fireImmediately) {
        if (fireImmediately)
            listener({
                observableKind: "value",
                debugObjectName: this.name_,
                object: this,
                type: UPDATE,
                newValue: this.value_,
                oldValue: undefined
            });
        return registerListener(this, listener);
    }
    raw() {
        // used by MST ot get undehanced value
        return this.value_;
    }
    toJSON() {
        return this.get();
    }
    toString() {
        return `${this.name_}[${this.value_}]`;
    }
    valueOf() {
        return toPrimitive(this.get());
    }
    [Symbol.toPrimitive]() {
        return this.valueOf();
    }
}
export const isObservableValue = createInstanceofPredicate("ObservableValue", ObservableValue);
