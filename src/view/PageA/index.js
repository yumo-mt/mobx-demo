import React,{useState} from 'react';
import  bankUser from './store';
import { observer } from 'mobx-react'



const PageA = observer(()=>{
   
  const change = ()=>{
    console.log(bankUser)
    bankUser.job = 'python工程师'
  }
  console.log(bankUser.job)
  return (
  	<>
     <p>{bankUser.job}</p>
     <button onClick={change}>改变</button>
    </>
  )
})

export default PageA;