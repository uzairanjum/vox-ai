// "use server"

// import { signup} from "@/app/auth/actions/auth"
// import { signIn,auth} from "@/auth"


// export async function doSocialLogin(formData:any){
// const action=formData.get("action")
// await signIn(action,{redirectTo:"/dashoard"})
// const data =await auth()
//   console.log("signIn response:", data);

// console.log("action",action)
// }

"use client";

import { signIn } from "next-auth/react";

export async function doSocialLogin() {
  await signIn("google", { callbackUrl: "/dashboard" }); 
}
