"use client"
import React, { useEffect } from 'react'
import axios from "axios";
import { useState } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';
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
      {children}
      </UserDetailContext.Provider>
      </div>
  )
}

export default Provider