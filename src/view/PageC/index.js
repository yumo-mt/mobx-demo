import React from 'react';
import TodoApp from '$component/TodoApp';

import styles from './styles.css';
export default class PageC extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      com1: 'com11'
    }
  }

  componentDidMount() {
  }
  build = () => {

    const data = [
      { title: 'A', value: [{ a: 1, b: 2 }, { a: 3, b: 4 }] },
      { title: 'B', value: [{ a: 5, b: 2 }, { a: 6, b: 4 }] },
    ]



    
    let dom = [];
    dom = data.map((i, idx) => {
      let out = [];
      let inner = [];
      out.push(
        <h1>{i.title}</h1>
      )
      inner = i.value.map((item, index) => {
        return <div key={index + '00' + idx}>{item.a}</div>
      })
      out.push(inner)
      return out;
    })

    return dom
  }
  render() {

    return (
      <div style={{ position: "absolute" }}>
        <div className={styles.pageC}>pageC</div>
        <TodoApp />
        {this.build()}
      </div>
    )
  }
}