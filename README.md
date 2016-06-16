#React-Redux-Schema

###Introduction

Like vanilla Redux has React-Redux, so will [Redux-Schema](https://github.com/ddsol/redux-schema) have this package to connect with react. Even though it's entirely possible to use React-Redux to `connect()` your components to the store, this is not the easiest way to do it. Well, at least it won't be when this package gets off the ground.

For now there's not much here :).

The idea is something like (adapted from react-redux [todomvc example](https://github.com/reactjs/redux/blob/master/examples/todomv)):

**index.js**
```js

...

let todoModel = schema('todo', {
  created: Date,
  completed: Boolean,
  title: String,
  toggle() {
    this.completed = !this.completed;
  }
  remove() {
    this._meta.owner.remove(this);
  }
});

let schema = {
  todos: collection(todoModel),
  
  filter: {
    type: String,
    validate: /^(?:all|active|completed)$/
  },
  
  clearCompleted() {
    this.todos.all.forEach(todo => {
      if (todo.completed) {
        todo.remove();
      }
    });
  }
  
  completeAll() {
    const allAreMarked = this.todos.all.every(todo => todo.completed);
    this.todos.forEach(todo => todo.completed = !allAreMarked);
  }
};

let createSchemaStore = schemaStore(schema, { debug: true }, createStore); <-- shorthand for ...ebug: true })(createStore)() 

let store = createSchemaStore()

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

And then:

**App.js**
```js

... (imports and such)

let { Todo } = store.schema.todos.model; <-- effectively binds a constructor for Todo to the path in the the store

class App extends Component {
  render() {
    const { todos, filter } = this.props.store
    return (
      <div>
        <Header addTodo={title => new Todo({ // <-- Ultra easy
          created: Date.now(),
          completed: false,
          title
        })} />
        <MainSection store = { store } /> //<-- By passing a parent object (here, the store), it's possible to have write access by setting properties. Needed for filter.
      </div>
    )
  }
}

App.propTypes = {
  store: store.toReactPropType(),
};

export default connect({
  store: '' //<-- This just means we want all the data. Could also say todos: 'todos' or form: 'forms.emailForm'
})(App);
```

**MainSection.js**
```js
...

const todoFilters = {
  all: () => true,
  active: todo => !todo.completed,
  completed: todo => todo.completed
};

class MainSection extends Component {
  renderToggleAll(completedCount) {
    const todos = this.props.store.todos
    if (todos.length > 0) {
      return (
        <input className="toggle-all"
               type="checkbox"
               checked={completedCount === todos.length}
               onChange={() => this.props.store.completeAll()} />
      )
    }
  }
  
  renderFooter(completedCount) {
    const { todos, filter } = this.props.store
    const activeCount = todos.length - completedCount

    if (todos.length) {
      return (
        <Footer completedCount={completedCount}
                activeCount={activeCount}
                filter={filter}
                onClearCompleted={()=>this.props.store.clearCompleted()}
                onShow={filter => this.props.store.filter = filter} />
      )
    }
  }
  
  render() {
    const { todos, filter } = this.props.store;

    const filteredTodos = todos.filter(todoFilters[filter])
    const completedCount = todos.reduce((count, todo) =>
      todo.completed ? count + 1 : count,
      0
    );

    return (
      <section className="main">
        <ul className="todo-list">
          {filteredTodos.map(todo =>
            <TodoItem key={todo.id} todo={todo} />
          )}
        </ul>
        {this.renderFooter(completedCount)}
      </section>
    )
  }
}

MainSection.propTypes = {
  store: store.toReactPropType()
}

export default MainSection
```


The above is missing a pile of files, but there isn't any package yet, so it's just to get an idea of how it works.
Of course:
- no actions
- no reducers
- no dispatch
- real methods
- `this` for state

