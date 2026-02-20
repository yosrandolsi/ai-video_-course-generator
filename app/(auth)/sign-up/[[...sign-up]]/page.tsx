import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return( 
   <div className="flex full h-screen items-center justify-center">
    <SignUp />
   </div>
  )
}