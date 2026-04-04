"use client"
import React, { useEffect } from 'react'
import axios from "axios";
import { useState } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';
import Header from './_components/Header';
function Provider({children}: {children: React.ReactNode}) {
   const[userDetail , setUserDetails] = useState(null);
useEffect(()=>{
  CreateNewUser();
} , [])
  const CreateNewUser=async ()=>{
    //user Api endpoint
    const result = await axios.post('/api/user' ,{});
    console.log(result.data);
    setUserDetails(result?.data);
  }
  return (
    <div> 
      <UserDetailContext.Provider value={{userDetail , setUserDetails}}>
        <div className='max-w-7xl mx-auto'> <Header /> {children} </div>
      
      </UserDetailContext.Provider>
      </div>
  )
}

export default Provider