import React,{useState} from 'react';
import Store from './store';
import { observer } from 'mobx-react'



const PageA = observer(()=>{
  // 使用的时候new一个新的实例，保证每次store都是初始状态。
  const [store] = useState(()=>{
  	return new Store;
  })
  const change = ()=>{
      store.job = 'python工程师'
  }
  return (
  	<>
     <p>{store.job}</p>
     <button onClick={change}>改变</button>
    </>
  )
})

export default PageA;