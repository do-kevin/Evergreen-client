import React from 'react';
import ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader/root';
import './index.scss';
import App from './App';
import * as serviceWorker from './serviceWorker';

const render = (Component) => {
  Component = hot(Component);
  return ReactDOM.render(<Component />, document.getElementById('root'));
};

render(App);

serviceWorker.unregister();
