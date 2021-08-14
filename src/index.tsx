import React, {
  useReducer,
  memo,
  Dispatch,
  createContext,
  useContext,
} from 'react';

import ReactDOM from 'react-dom';
import './index.scss';

interface Todo {
  value: string;
  id: number;
  checked: boolean;
  removed: boolean;
}

type Filter = 'all' | 'checked' | 'unchecked' | 'removed';

interface State {
  text: string;
  todos: Todo[];
  filter: Filter;
}

const initialState: State = {
  text: '',
  todos: [],
  filter: 'all',
};

type Action =
  | { type: 'change'; value: string }
  | { type: 'filter'; value: Filter }
  | { type: 'submit' }
  | { type: 'empty' }
  | { type: 'edit'; id: number; value: string }
  | { type: 'check'; id: number; checked: boolean }
  | { type: 'remove'; id: number; removed: boolean };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'change': {
      return { ...state, text: action.value };
    }
    case 'submit': {
      if (!state.text) return state;

      const newTodo: Todo = {
        value: state.text,
        id: new Date().getTime(),
        checked: false,
        removed: false,
      };
      return { ...state, todos: [newTodo, ...state.todos], text: '' };
    }
    case 'filter':
      return { ...state, filter: action.value };
    case 'edit': {
      const newTodos = state.todos.map((todo) => {
        if (todo.id === action.id) {
          todo.value = action.value;
        }
        return todo;
      });
      return { ...state, todos: newTodos };
    }
    case 'check': {
      const newTodos = state.todos.map((todo) => {
        if (todo.id === action.id) {
          todo.checked = !action.checked;
        }
        return todo;
      });
      return { ...state, todos: newTodos };
    }
    case 'remove': {
      const newTodos = state.todos.map((todo) => {
        if (todo.id === action.id) {
          todo.removed = !action.removed;
        }
        return todo;
      });
      return { ...state, todos: newTodos };
    }
    case 'empty': {
      const newTodos = state.todos.filter((todo) => !todo.removed);
      return { ...state, todos: newTodos };
    }
    default:
      return state;
  }
};

const AppContext = createContext(
  {} as {
    state: State;
    dispatch: Dispatch<Action>;
  }
);

// Selector コンポーネント
const Selector: React.VFC = memo(() => {
  const { dispatch } = useContext(AppContext);

    const handleOnFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch({ type: 'filter', value: e.target.value as Filter });
    };

    return (
      <select className="select" defaultValue="all" onChange={handleOnFilter}>
        <option value="all">すべてのタスク</option>
        <option value="checked">完了したタスク</option>
        <option value="unchecked">現在のタスク</option>
        <option value="removed">削除済みのタスク</option>
      </select>
    );
  }
);
Selector.displayName = 'Selector';

// EmptyButton コンポーネント
const EmptyButton: React.VFC = memo(() => {
  const { state, dispatch } = useContext(AppContext);

    const handleOnEmpty = () => {
      dispatch({ type: 'empty' });
    };

    return (
      <button
        className="empty"
        onClick={handleOnEmpty}
        disabled={state.todos.filter((todo) => todo.removed).length === 0}
      >
        ごみ箱を空にする
      </button>
    );
  }
);
EmptyButton.displayName = 'EmptyButton';

// Form コンポーネント
const Form: React.VFC = memo(() => {
  const { state, dispatch } = useContext(AppContext);

    const handleOnSubmit = (
      e: React.FormEvent<HTMLFormElement | HTMLInputElement>
    ) => {
      e.preventDefault();
      dispatch({ type: 'submit' });
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'change', value: e.target.value });
    };

    return (
      <form className="form" onSubmit={handleOnSubmit}>
        <input
          className="text"
          type="text"
          disabled={state.filter === 'checked'}
          value={state.text}
          onChange={handleOnChange}
        />
        <input
          className="button"
          type="submit"
          disabled={state.filter === 'checked'}
          value="追加"
          onSubmit={handleOnSubmit}
        />
      </form>
    );
  }
);
Form.displayName = 'Form';

// FilteredTodos コンポーネント
const FilteredTodos: React.VFC = memo(() => {
  const { state, dispatch } = useContext(AppContext);

  const handleOnEdit = (id: number, value: string) => {
    dispatch({ type: 'edit', id, value });
  };

  const handleOnCheck = (id: number, checked: boolean) => {
    dispatch({ type: 'check', id, checked });
  };

  const handleOnRemove = (id: number, removed: boolean) => {
    dispatch({ type: 'remove', id, removed });
  };

  const filteredTodos = state.todos.filter((todo) => {
    switch (state.filter) {
      case 'all':
        return !todo.removed;
      case 'checked':
        return !todo.removed && todo.checked;
      case 'unchecked':
        return !todo.removed && !todo.checked;
      case 'removed':
        return todo.removed;
      default:
        return todo;
    }
  });

  return (
    <ul>
      {filteredTodos.map((todo) => {
        return (
          <li key={todo.id}>
            <input
              type="checkbox"
              disabled={todo.removed}
              checked={todo.checked}
              onChange={() => handleOnCheck(todo.id, todo.checked)}
            />
            <input
              className="text"
              type="text"
              disabled={todo.checked || todo.removed}
              value={todo.value}
              onChange={(e) => handleOnEdit(todo.id, e.target.value)}
            />
            <button
              className="button"
              onClick={() => handleOnRemove(todo.id, todo.removed)}>
              {todo.removed ? '復元' : '削除'}
            </button>
          </li>
        );
      })}
    </ul>
  );
});
FilteredTodos.displayName = 'FilteredTodos';

const App: React.VFC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className="container">
      <Selector />
      {state.filter === 'removed' ? (
        <EmptyButton />
      ) : (
        <Form />
      )}
      <FilteredTodos />
    </div>
    </AppContext.Provider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));