# React Redux Schema

Official bindings for [Redux-Schema](https://github.com/ddsol/redux-schema).

## Installation

React Redux Schema requires **Redux Schema** and **React 0.14 or later**.


```
npm install --save react-redux-schema
```

This library does _not_ come with a store provider, but you can use
the [provider](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store)
from [React Redux](https://github.com/reactjs/react-redux).

## API

### `connect([options])`

Connects a React component to a Redux Schema store.

It does not modify the component class passed to it.
Instead, it returns a new, connected component class for you to use.

#### Arguments

* [`options`] *(Object)* If specified, customizes the behavior of the connector.
  * [`pure = true`] *(Boolean)*: If true, implements `shouldComponentUpdate` and determines what data is used by the component, and compares it to any new state, preventing unnecessary updates, assuming that the component is a “pure” component and does not rely on any input or state other than its props and the selected Redux Schema store’s state. *Defaults to `true`.*caveat elit
  * [`withRef = false`] *(Boolean)*: If true, stores a ref to the wrapped component instance and makes it available via `getWrappedInstance()` method. *Defaults to `false`.*

#### Example

```js
import connect from 'react-redux-schema'

export default connect()(MyApp);
```


## How it works

Every time data accessed through the Redux Schema store, the store can record the path where this data is stored in the state. During rendering of the wrapped component, this tracing is enabled. By doing this, it becomes known what data the element depends on. Redux Schema Connect can then determine if the component needs to be rerendered.

Since the parent component can pass Redux Schema instances, and since the component itself has access to the Schema Store, there is no need for selectors. Since the Redux Schema instances allow direct writes without violating immutability of the store, there is no need for any actions, dispatching, or binding.

In React Redux Schema, the purpose of connect is not so much to connect the component to the data, but instead it helps to render if and only if it's needed. Even if sub-components are not Redux Schema aware, they will still leave a trace when accessing the Redux Schema instances.

It is important to keep in mind that `connect` can only manage data access through Redux Schema instances. If data is accessed from anywhere else, or directly from the state, then this access is not tracked. Therefore, if the data later changes, then there is no way for `connect` to be aware of this. It will stubbornly refuse to rerender if neither props nor previously registered state have changed. Even if the internal state of a wrapped component changes, it will still not be rerendered, because (as in React Redux connect) the element is cached. The only data that is checked are the props passed and the previously accessed state. Because of this, when the option `pure: false` is passed, the connect component will always rerender when anything in the store changes. 


