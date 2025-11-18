// // import { createClient } from '@/utils/supabase/server'
// import { redirect } from "next/navigation";

// export default async function WelcomePage() {
//   // const supabase = await createClient()
//   // const {
//   //   data: { user },
//   //   error,
//   // } = await supabase.auth.getUser();

//   // if (error || !user) {
//   //   redirect("/auth/login");
//   // }

//   // const { data: profile } = await supabase
//   //   .from('user_profile')
//   //   .select('*')
//   //   .eq('user_id_auth', user.id)
//   //   .single()

//   // const userName = profile?.data?.firstName || profile?.user_name || user.email?.split('@')[0]

//   return (
//     <></>
//     // <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
//     //   <div className="max-w-2xl mx-auto text-center space-y-8">
//     //     <div className="space-y-4">
//     //       <h1 className="text-4xl font-bold">
//     //         Welcome, {userName}!
//     //       </h1>
//     //       <p className="text-xl text-muted-foreground">
//     //         You've successfully joined our AI-powered conversation platform
//     //       </p>
//     //     </div>

//     //     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//     //       <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
//     //         <h3 className="font-semibold mb-2">AI-Powered Conversations</h3>
//     //         <p className="text-sm text-muted-foreground">
//     //           Enhance your support with intelligent AI assistance
//     //         </p>
//     //       </div>
//     //       <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
//     //         <h3 className="font-semibold mb-2">Team Collaboration</h3>
//     //         <p className="text-sm text-muted-foreground">
//     //           Work seamlessly with your team and customers
//     //         </p>
//     //       </div>
//     //       <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
//     //         <h3 className="font-semibold mb-2">Advanced Analytics</h3>
//     //         <p className="text-sm text-muted-foreground">
//     //           Track performance and optimize your workflows
//     //         </p>
//     //       </div>
//     //     </div>

//     //     <div className="space-y-4">
//     //       <a
//     //         href="/dashboard"
//     //         className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
//     //       >
//     //         Go to Dashboard
//     //       </a>
//     //       <div>
//     //         <a
//     //           href="/dashboard/profile"
//     //           className="text-sm text-muted-foreground hover:text-foreground"
//     //         >
//     //           Complete your profile setup
//     //         </a>
//     //       </div>
//     //     </div>
//     //   </div>
//     // </div>
//   );
// }

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome Page</h1>
    </div>
  );
}
