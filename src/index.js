import React from 'react';
import { render } from 'react-dom';
import { Link, HashRouter, BrowserRouter, Route, NavLink, Switch } from 'react-router-dom';


import PageA from './view/PageA';

import styles from './app.css'

const leftNav = () => {
  return (
    <nav>
      <ul className={styles.navUl}>
        <li><NavLink activeStyle={{ color: 'blue' }} to="/pageA">com1</NavLink></li>
        <li><NavLink activeStyle={{ color: 'blue' }} to="/pageB">com2</NavLink></li>
        <li><NavLink activeStyle={{ color: 'blue' }} to="/pageC">com3</NavLink></li>
      </ul>
    </nav>
  )
};
class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <Route render={({ location }) => (
          <div>
            <div>
              {leftNav()}
              <hr />
            </div>
            <div>
              <div key={location.pathname}>
                <Switch key={location.key} location={location}>
                  <Route exact path="/" component={PageA} />
                  <Route exact path="/pageA" component={PageA} />
                </Switch>
              </div>
            </div>
          </div>
        )} />
      </HashRouter>
    )
  }
};

render(<App />, document.getElementById('app'))

