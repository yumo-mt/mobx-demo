import React from 'react';
import store from './store';
import { observer } from 'mobx-react'



const PageA = observer(()=>{
  // 使用的时候new一个新的实例，保证每次store都是初始状态。
  const [store] = useState(()=>{
  	return new Store;
  })
  return (
  	<>
     <p>{store.model.a}</p>
    </>
  )
})

export default PageA;