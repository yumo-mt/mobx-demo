import React from 'react';
import store from './store';
import { observer } from 'mobx-react'


@observer
class PageA extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }
  clickBtn = () => {
    console.log('改变')
    store.data = '改变'
  }
  render() {
    return (
      <div style={{ position: "absolute" }}>
        <>
          <div>{store.data}</div>
          <div onClick={this.clickBtn}>A</div>
          <div>A</div>
          <div>A</div>
        </>
      </div>
    )
  }
}

export default PageA;