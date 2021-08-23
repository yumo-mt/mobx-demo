import React, { createContext } from 'react';
import TodoApp from '$component/TodoApp';
import css from './styles.css'
import img from './15.jpg';
import imgBig from './65.jpg'

const theme = {
  background: 'red',
};
const ThemeContext = createContext(theme);
export default class PageB extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      background: 'red'
    }
  }

  componentDidMount() {
  }
  changeColor = () => {
    if (this.state.background === 'red') {
      this.setState({
        background: 'green'
      })
    }else{
      this.setState({
        background:'red'
      })
    }
  }
  render() {

    return (
      <div className={css.boxA}>
        <button onClick={this.changeColor}>A</button>
        <ThemeContext.Provider value={this.state.background}>
          <BoxB />
        </ThemeContext.Provider>
      </div>
    )
  }
}

class BoxB extends React.Component {

  render() {
    return (
      <div className={css.boxB}>
        B
        <BoxC></BoxC>
      </div>
    )
  }
}
class BoxC extends React.Component {

  render() {
    return (
      <div className={css.boxC}>
        <ThemeContext.Consumer>
          {
            (v) => {
              console.log(v);
              return <div style={{ color: v }}>this is Consumer
              </div>
            }
          }
        </ThemeContext.Consumer>
      </div>
    )
  }
}

