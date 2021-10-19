import {
  ObservableMap,
  ObservableSet,
  ObservableValue,
  asDynamicObservableObject,
  createObservableArray,
  deepEnhancer,
  extendObservable,
  isES6Map,
  isES6Set,
  isObservable,
  isPlainObject,
  referenceEnhancer,
  shallowEnhancer,
  refStructEnhancer,
  asObservableObject,
  storeAnnotation,
  createDecoratorAnnotation,
  createLegacyArray,
  globalState,
  assign,
  isStringish,
  createObservableAnnotation,
} from '../internal';
export const OBSERVABLE = 'observable';
export const OBSERVABLE_REF = 'observable.ref';
export const OBSERVABLE_SHALLOW = 'observable.shallow';
export const OBSERVABLE_STRUCT = 'observable.struct';
// Predefined bags of create observable options, to avoid allocating temporarily option objects
// in the majority of cases
export const defaultCreateObservableOptions = {
  deep: true,
  name: undefined,
  defaultDecorator: undefined,
  proxy: true,
};
Object.freeze(defaultCreateObservableOptions);
export function asCreateObservableOptions(thing) {
  return thing || defaultCreateObservableOptions;
}
const observableAnnotation = createObservableAnnotation('observable');
const observableRefAnnotation = createObservableAnnotation('observable.ref', {
  enhancer: referenceEnhancer,
});
const observableShallowAnnotation = createObservableAnnotation('observable.shallow', {
  enhancer: shallowEnhancer,
});
const observableStructAnnotation = createObservableAnnotation('observable.struct', {
  enhancer: refStructEnhancer,
});
const observableDecoratorAnnotation = createDecoratorAnnotation(observableAnnotation);
export function getEnhancerFromOptions(options) {
  return options.deep === true
    ? deepEnhancer
    : options.deep === false
    ? referenceEnhancer
    : getEnhancerFromAnnotation(options.defaultDecorator);
}
export function getAnnotationFromOptions(options) {
  return options
    ? options.deep === true
      ? observableAnnotation
      : options.deep === false
      ? observableRefAnnotation
      : options.defaultDecorator
    : undefined;
}
export function getEnhancerFromAnnotation(annotation) {
  var _a, _b;
  return !annotation
    ? deepEnhancer
    : (_b = (_a = annotation.options_) === null || _a === void 0 ? void 0 : _a.enhancer) !== null &&
      _b !== void 0
    ? _b
    : deepEnhancer;
}
/**
 * Turns an object, array or function into a reactive structure.
 * 将对象、数组或函数转换为反应式结构。本身不提供转换功能
 * @param v the value which should become observable.
 *
 * 策略设计模式：将多种数据类型（Object、Array、Map）情况的转换封装起来，好让调用者不需要关心实现细节
 *
 */
function createObservable(v, arg2, arg3) {
  // @observable someProp;
  if (isStringish(arg2)) {
    storeAnnotation(v, arg2, observableAnnotation);
    return;
  }
  // already observable - ignore
  if (isObservable(v)) {
    return v;
  }
  // plain object
  if (isPlainObject(v)) {
    return observable.object(v, arg2, arg3);
  }
  // Array
  if (Array.isArray(v)) {
    return observable.array(v, arg2);
  }
  // Map
  if (isES6Map(v)) {
    return observable.map(v, arg2);
  }
  // Set
  if (isES6Set(v)) {
    return observable.set(v, arg2);
  }
  // other object - ignore
  if (typeof v === 'object' && v !== null) {
    return v;
  }
  // anything else
  return observable.box(v);
}
Object.assign(createObservable, observableDecoratorAnnotation);
const observableFactories = {
  box(value, options) {
    const o = asCreateObservableOptions(options);
    return new ObservableValue(value, getEnhancerFromOptions(o), o.name, true, o.equals);
  },
  array(initialValues, options) {
    const o = asCreateObservableOptions(options);
    return (
      globalState.useProxies === false || o.proxy === false
        ? createLegacyArray
        : createObservableArray
    )(initialValues, getEnhancerFromOptions(o), o.name);
  },
  map(initialValues, options) {
    const o = asCreateObservableOptions(options);
    return new ObservableMap(initialValues, getEnhancerFromOptions(o), o.name);
  },
  set(initialValues, options) {
    const o = asCreateObservableOptions(options);
    return new ObservableSet(initialValues, getEnhancerFromOptions(o), o.name);
  },
  object(props, decorators, options) {
    if (
      globalState.useProxies === false ||
      (options === null || options === void 0 ? void 0 : options.proxy)
    ) {
      const p = asObservableObject({}, options);
      return extendObservable(p, props, decorators);
    } else {
      const p = asObservableObject({}, options);
      console.log(p);
      return extendObservable(p, props, decorators);
    }
  },
  ref: createDecoratorAnnotation(observableRefAnnotation),
  shallow: createDecoratorAnnotation(observableShallowAnnotation),
  deep: observableDecoratorAnnotation,
  struct: createDecoratorAnnotation(observableStructAnnotation),
};
// eslint-disable-next-line
export var observable = assign(createObservable, observableFactories);
