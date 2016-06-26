import { Component, createElement } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import invariant from 'invariant';
import { PropTypes } from 'react';

//From react-redux (c) Dan Abramov
const storeShape = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  getState: PropTypes.func.isRequired,
  trace: PropTypes.func.isRequired,
  sameRecordedState: PropTypes.func.isRequired
});

//From react-redux (c) Dan Abramov
function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  const hasOwn = Object.prototype.hasOwnProperty;
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) ||
      objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }

  return true;
}

//Most code below here based on react-redux (c) Dan Abramov
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

// Helps track hot reloading.
let nextVersion = 0;

export default function connect(options = {}) {
  // Helps track hot reloading.
  const version = nextVersion++;
  const { pure = true, withRef = false } = options;

  return function wrapWithConnect(WrappedComponent) {
    const connectDisplayName = `SchemaConnect(${getDisplayName(WrappedComponent)})`;

    let ElementComponent = WrappedComponent;
    if (ElementComponent.prototype && ElementComponent.prototype.isReactComponent && ElementComponent.prototype.render) {
      if (options.injectTrace) {
        let renderMethod = ElementComponent.prototype.render;
        ElementComponent.prototype.render = function(props) {
          if (props && typeof props.trace === 'function') {
            return props.trace(() => renderMethod.apply(this, arguments));
          } else {
            return renderMethod.apply(this, arguments);
          }
        };
      }
    } else {
      ElementComponent = function(props) {
        if (props && typeof props.trace === 'function') {
          return props.trace(() => WrappedComponent.apply(this, arguments));
        } else {
          return WrappedComponent.apply(this, arguments);
        }
      };
    }
    Object.defineProperty(ElementComponent, 'name', {
      configurable: true,
      enumerable: true,
      value: WrappedComponent.name
    });

    class Connect extends Component {
      shouldComponentUpdate() {
        return !this.recorded || this.haveOwnPropsChanged || this.hasStoreStateChanged;
      }

      constructor(props, context) {
        super(props, context);
        this.version = version;
        this.store = props.store || context.store;

        if (!this.store) {
          Object.keys(props).forEach(name => {
            if (this.store) return;
            let prop = props[name];
            if (prop._meta && prop._meta.store) {
              this.store = prop._meta.store;
            }
          });
        }

        invariant(this.store,
          `Could not find "store" in either the context or ` +
          `props of "${connectDisplayName}". ` +
          `Either wrap the root component in a <Provider>, ` +
          `or explicitly pass "store" as a prop to "${connectDisplayName}".`
        );

        const storeState = this.store.getState();
        this.state = { storeState };
        this.clearCache();
        let tracing = false;
        this.trace = func => {
          if (tracing) return func();
          tracing = true;
          let result = undefined;
          try {
            this.recorded = this.store.trace(() => {
              result = func();
            }, true);
          } finally {
            tracing = false;
          }
          return result;
        };
      }

      isSubscribed() {
        return typeof this.unsubscribe === 'function';
      }

      trySubscribe() {
        if (this.recorded && !this.unsubscribe) {
          this.unsubscribe = this.store.subscribe(this.handleChange.bind(this));
          this.handleChange();
        }
      }

      tryUnsubscribe() {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
      }

      componentDidMount() {
        this.trySubscribe();
      }

      componentWillReceiveProps(nextProps) {
        if (!pure || !shallowEqual(nextProps, this.props)) {
          this.haveOwnPropsChanged = true;
        }
      }

      componentWillUnmount() {
        this.tryUnsubscribe();
        this.clearCache();
      }

      clearCache() {
        this.recorded = undefined;
      }

      handleChange() {
        if (!this.unsubscribe) {
          return;
        }

        const storeState = this.store.getState();

        if (this.recorded && this.store.sameRecordedState(this.recorded)) {
          return;
        }

        this.hasStoreStateChanged = true;
        this.setState({ storeState });
      }

      getWrappedInstance() {
        invariant(withRef,
          `To access the wrapped instance, you need to specify ` +
          `{ withRef: true } as the fourth argument of the connect() call.`
        );

        return this.refs.wrappedInstance;
      }

      render() {
        const {
                haveOwnPropsChanged,
                hasStoreStateChanged,
                renderedElement
                } = this;

        this.haveOwnPropsChanged = false;
        this.hasStoreStateChanged = false;

        if (pure && !haveOwnPropsChanged && !hasStoreStateChanged && renderedElement) {
          return renderedElement;
        }

        if (withRef) {
          this.renderedElement = createElement(ElementComponent, {
            ...this.props,
            trace: this.trace,
            ref: 'wrappedInstance'
          });
        } else {
          this.renderedElement = createElement(ElementComponent, { ...this.props, trace: this.trace });
        }

        return this.renderedElement;
      }
    }

    Connect.displayName = connectDisplayName;
    Connect.WrappedComponent = WrappedComponent;
    Connect.contextTypes = {
      store: storeShape
    };
    Connect.propTypes = {
      store: storeShape
    };

    if (process.env.NODE_ENV !== 'production') {
      Connect.prototype.componentWillUpdate = function componentWillUpdate() {
        if (this.version === version) {
          return;
        }

        // We are hot reloading!
        this.version = version;
        this.trySubscribe();
        this.clearCache();
      };
    }

    return hoistStatics(Connect, WrappedComponent);
  };
}
