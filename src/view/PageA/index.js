import React,{useState} from 'react';
import  bankUser from './store';
import { observer } from 'mobx-react'



const PageA = observer(()=>{
   
  const change = ()=>{
    bankUser.job = 'python工程师'
  }
  return (
  	<>
     <p>{bankUser.job}</p>
     <button onClick={change}>改变</button>
    </>
  )
})

export default PageA;