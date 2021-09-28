import React from 'react';
import store from './store';
import { observer } from 'mobx-react'





@observer
class PageA extends React.Component {

  clickBtn = () => {
    console.log('改变')
    store.job = '改变'
  }
  render() {
    return (
      <div style={{ position: "absolute" }}>
        <>
          <div>{store.job}</div>
          <button onClick={this.clickBtn}>你其实不知道，这是一个按钮</button>
        </>
      </div>
    )
  }
}

export default PageA;