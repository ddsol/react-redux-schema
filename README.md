# React Redux Schema

Official bindings for [Redux-Schema](https://github.com/ddsol/redux-schema).

## Installation

React Redux Schema requires **Redux Schema** and **React 0.14 or later**.


```
npm install --save react-redux-schema
```

## API

### `connect([options])`

Connects a React component to a Redux Schema store.

It does not modify the component class passed to it.
Instead, it returns a new, connected component class for you to use.

#### Arguments

* [`options`] *(Object)* If specified, customizes the behavior of the connector.
  * [`pure = true`] *(Boolean)*: If true, implements `shouldComponentUpdate` and determines what data is used by the component, and compares it to any new state, preventing unnecessary updates, assuming that the component is a “pure” component and does not rely on any input or state other than its props and the selected Redux Schema store’s state. *Defaults to `true`.*caveat elit
  * [`withRef = false`] *(Boolean)*: If true, stores a ref to the wrapped component instance and makes it available via `getWrappedInstance()` method. *Defaults to `false`.*
  * [`injectTrace = false`] *(Boolean)*: If true, will replace the render method on the wrapped component by one that is wrapped in a call to `store.trace`. This has to be passed in in explicitly because it modifies the wrapped component.
#### Example

```js
import connect from 'react-redux-schema'
let MyApp = ({info}) => <div>{info.value}</div>;

export default connect()(MyApp);
```

## Tracing access
There are 3 ways for `connect` to speed up rendering by tracing state usage:
- If your component is a pure render function, it's automatically wrapped in a trace call
- If you pass the `injectTrace: true` option, your render function is replaced with one that is wrapped in a `trace` call.
- You can manually call `trace`. The component will be passed a `trace` prop, which is a function that you can use to wrap the rendering so that all access to store data is registered.

If `trace` is never called by one of the above methods, then the component will be rendered on every store change.

### Pure function
```js
import connect from 'react-redux-schema'
let MyApp = ({info}) => <div>{info.value}</div>;

export default connect()(MyApp);
```

### Pass `intectTrace: true`

```js
import connect from 'react-redux-schema';
import React from 'react';

class MyApp extends React.Component {
  render() {
    return <div>Hello {this.props.data.name}</div>;
  }
}

export default connect({ injectTrace: true })(MyApp);

```

### Wrap render with `trace`

```js
import connect from 'react-redux-schema';
import React from 'react';

class MyApp extends React.Component {
  render() {
    return this.props.trace(()=>{
      return <div>Hello {this.props.data.name}</div>;
    });
  }
}

export default connect()(MyApp);

```

## How it works

Every time data accessed through the Redux Schema store, the store can record the path where this data is stored in the state. During rendering of the wrapped component, this tracing is enabled. By doing this, it becomes known what data the element depends on. Redux Schema Connect can then determine if the component needs to be rerendered.

Since the parent component can pass Redux Schema instances, and since the component itself has access to the Schema Store, there is no need for selectors. Since the Redux Schema instances allow direct writes without violating immutability of the store, there is no need for any actions, dispatching, or binding.

In React Redux Schema, the purpose of connect is not so much to connect the component to the data, but instead it helps to render if and only if it's needed. Even if sub-components are not Redux Schema aware, they will still leave a trace when accessing the Redux Schema instances.

It is important to keep in mind that `connect` can only manage data access through Redux Schema instances. If data is accessed from anywhere else, or directly from the state, then this access is not tracked. Therefore, if the data later changes, then there is no way for `connect` to be aware of this. It will stubbornly refuse to rerender if neither props nor previously registered state have changed. The only data that is checked are the props passed and the previously accessed state. Because of this, when the option `pure: false` is passed, the connect component will always rerender when anything in the store changes. 

There is no need to use a store provider. Simply passing a redux-schema instance gives `connect` enough information to get the store and setup the state monitoring.


## Considerations

Because only property accesses can be traced, if you pass a simple value (such as a String, Number, or plain object) that may be the result of some property access to a child component, then the component that accessed the property will be rerendered.

```js
import connect from 'react-redux-schema';
import React from 'react';

let Child = ({show}) => (<span>{show}</span>); 

let App = ({root}) => (
  <div>
    Child:
    <Child show={root.show} />
  </div>
)
App = connect()(App)

```

In this example, the new property value will still be passed to the child component, and therefore rerender it, but often it's not necessary to rerender the parent component itself. In this case it may be better to pass the containing Redux Shema instance object to the child component instead.

```js
import connect from 'react-redux-schema';
import React from 'react';


let Child = ({root}) => (<span>{root.show}</span>); 

Child = connect()(Child);

let App = ({root}) => (
  <div>
    Child:
    <Child show={root} />
  </div>
)
App = connect()(App)
```

In this example, Child will be rerendered when `root.show` changes, but `App` will not.

Note that in the last example it's not neccesary to `connect()` the `App` since it doesn't use any part of the Redux Schema instance passed to it.
