"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { login, resetPassword } from "@/app/auth/actions/auth";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSocket } from "../../../../context/SocketProvider";
import { doSocialLogin } from "@/_components/actions/googleAction";
import { signIn } from "next-auth/react";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { supabaseBrowser } from "@/app/lib/supabase-browser";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Better error message mapping
const getErrorMessage = (error: string): string => {
  if (error.includes("Invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (error.includes("Email not confirmed")) {
    return "Please check your email and click the confirmation link before signing in.";
  }
  if (error.includes("Too many requests")) {
    return "Too many login attempts. Please wait a few minutes and try again.";
  }
  if (error.includes("Network")) {
    return "Network error. Please check your connection and try again.";
  }
  return error || "Something went wrong. Please try again.";
};

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [isResetPending, setIsResetPending] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);

  // const { connectWithSocket } = useSocket();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  React.useEffect(() => {
    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement;
    if (emailInput) emailInput.focus();
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    console.log("logingin in .....");

    setErrorMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      console.log("before login");

      const result = await login(formData);

      console.log("after login", result);

      // if (result && "success" in result) {
      //   connectWithSocket(result.access_token);

      //   // ✅ Navigate from client component
      //   router.push("/dashboard"); // or ROUTES.dashboard
      // }

      if (result && "error" in result) {
        setErrorMessage(getErrorMessage(result.error));
      }
    });
  };

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    setIsResetPending(true);

    const formData = new FormData();
    formData.append("email", values.email);

    try {
      const result = await resetPassword(formData);

      if (result && "error" in result) {
        toast.error(getErrorMessage(result.error));
      } else {
        setResetSuccess(true);
        toast.success("Password reset email sent! Check your inbox.");
        resetForm.reset();
      }
    } catch (error) {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setIsResetPending(false);
    }
  };

  const handleResetDialogClose = () => {
    setIsResetDialogOpen(false);
    setResetSuccess(false);
    resetForm.reset();
  };
  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/dashboard/app/leadconnector" });
  };
  // async function handleGoogleLogin() {
  //     const supabase = await getSupabase();
  // await supabase.auth.signInWithOAuth({
  //   provider: "google",
  //   options: { redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard` }
  // });
  // await signIn("google", { callbackUrl: "/dashboard" });

  return (
    <>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {/* <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-black via-gray-900 to-gray-950 text-white">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-2xl shadow-xl overflow-hidden"> */}

      {/* Left Section - Login Form */}
      <div className="dark:bg-black/90 p-10 flex flex-col justify-center">
        <h2 className="text-2xl font-semibold mb-2 text-black dark:text-white">
          Log in to your account
        </h2>
        <p className="text-gray-400 mb-6">
          Welcome back! Please enter your details to continue.
        </p>
        {/* <form action={doSocialLogin}>
          <button className="w-full flex items-center justify-center gap-2 border border-gray-600 text-black dark:text-white rounded-lg py-2 mb-6 hover:bg-gray-800 transition"
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Log in with Google
          </button>
        </form> */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 border border-gray-600 text-black dark:text-white rounded-lg py-2 mb-6 hover:bg-gray-800 transition"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Log in with Google
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-grow h-px bg-gray-700"></div>
          <span className="px-3 text-gray-500 text-sm">OR</span>
          <div className="flex-grow h-px bg-gray-700"></div>
        </div>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your email"
                          disabled={isPending}
                          className="pl-10 text-black dark:text-white"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                /> */}
            </div>

            <div>
              {/* <div className="flex justify-between items-center mb-1">
              <label className="block text-sm text-gray-400">Password</label>
              <a href="#" className="text-sm text-orange-400 hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-orange-500 outline-none"
            /> */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1">
                      <FormLabel className="text-black dark:text-white">
                        Password
                      </FormLabel>
                      <Dialog
                        open={isResetDialogOpen}
                        onOpenChange={setIsResetDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm text-primary hover:underline"
                          >
                            Forgot password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Enter your email address and we'll send you a link
                              to reset your password.
                            </DialogDescription>
                          </DialogHeader>

                          {resetSuccess ? (
                            <div className="flex flex-col items-center gap-4 py-4">
                              <CheckCircle2 className="h-12 w-12 text-green-500" />
                              <div className="text-center">
                                <h3 className="text-lg font-semibold">
                                  Email Sent!
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Check your inbox for password reset
                                  instructions.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <Form {...resetForm}>
                              <form
                                onSubmit={resetForm.handleSubmit(
                                  handleResetPassword
                                )}
                                className="space-y-4"
                              >
                                <FormField
                                  control={resetForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            placeholder="Enter your email"
                                            disabled={isResetPending}
                                            className="pl-10 text-black dark:text-white"
                                            {...field}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <DialogFooter className="gap-2 sm:gap-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleResetDialogClose}
                                    disabled={isResetPending}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={isResetPending}
                                  >
                                    {isResetPending ? (
                                      <>
                                        <LoadingSpinner className="mr-2 h-4 w-4" />
                                        Sending...
                                      </>
                                    ) : (
                                      "Send Reset Link"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          )}

                          {resetSuccess && (
                            <DialogFooter>
                              <Button
                                onClick={handleResetDialogClose}
                                className="w-full"
                              >
                                Close
                              </Button>
                            </DialogFooter>
                          )}
                        </DialogContent>
                      </Dialog>
                      {/* <a href="#" className="text-sm text-orange-400 hover:underline">
                        Forgot password?
                      </a> */}
                    </div>

                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={isPending}
                          className="pl-10 pr-10 text-black dark:text-white"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isPending}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-gray-400">Remember me</span>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <div className="flex items-center">
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Signing in...
                </div>
              ) : (
                "Log in"
              )}
            </Button>
            {/* <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 py-2 rounded-lg font-medium text-white transition"
            >
              Log in
            </button> */}
          </form>
        </Form>
        <p className="mt-6 text-sm text-gray-400 text-center">
          Don’t have an account?{" "}
          <a href="/auth/signup" className="text-orange-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div /> {/* Spacer */}
      </div>
      {/* Right Section - Promo */}

      {/* </div>
      </div> */}
    </>
  );
}
//  <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//           <FormField
//             control={form.control}
//             name="email"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Email</FormLabel>
//                 <FormControl>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       placeholder="Enter your email"
//                       disabled={isPending}
//                       className="pl-10"
//                       {...field}
//                     />
//                   </div>
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="password"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Password</FormLabel>
//                 <FormControl>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       type={showPassword ? "text" : "password"}
//                       placeholder="Enter your password"
//                       disabled={isPending}
//                       className="pl-10 pr-10"
//                       {...field}
//                     />
//                     <Button
//                       type="button"
//                       variant="ghost"
//                       size="sm"
//                       className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                       onClick={() => setShowPassword(!showPassword)}
//                       disabled={isPending}
//                     >
//                       {showPassword ? (
//                         <EyeOff className="h-4 w-4 text-muted-foreground" />
//                       ) : (
//                         <Eye className="h-4 w-4 text-muted-foreground" />
//                       )}
//                     </Button>
//                   </div>
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <div className="flex items-center justify-between text-sm">
//             <div /> {/* Spacer */}
//             <Dialog
//               open={isResetDialogOpen}
//               onOpenChange={setIsResetDialogOpen}
//             >
//               <DialogTrigger asChild>
//                 <Button
//                   variant="link"
//                   className="p-0 h-auto text-sm text-primary hover:underline"
//                 >
//                   Forgot password?
//                 </Button>
//               </DialogTrigger>
//               <DialogContent className="sm:max-w-md">
//                 <DialogHeader>
//                   <DialogTitle>Reset Password</DialogTitle>
//                   <DialogDescription>
//                     Enter your email address and we'll send you a link to reset
//                     your password.
//                   </DialogDescription>
//                 </DialogHeader>

//                 {resetSuccess ? (
//                   <div className="flex flex-col items-center gap-4 py-4">
//                     <CheckCircle2 className="h-12 w-12 text-green-500" />
//                     <div className="text-center">
//                       <h3 className="text-lg font-semibold">Email Sent!</h3>
//                       <p className="text-sm text-muted-foreground mt-1">
//                         Check your inbox for password reset instructions.
//                       </p>
//                     </div>
//                   </div>
//                 ) : (
//                   <Form {...resetForm}>
//                     <form
//                       onSubmit={resetForm.handleSubmit(handleResetPassword)}
//                       className="space-y-4"
//                     >
//                       <FormField
//                         control={resetForm.control}
//                         name="email"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Email</FormLabel>
//                             <FormControl>
//                               <div className="relative">
//                                 <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                                 <Input
//                                   placeholder="Enter your email"
//                                   disabled={isResetPending}
//                                   className="pl-10"
//                                   {...field}
//                                 />
//                               </div>
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />

//                       <DialogFooter className="gap-2 sm:gap-0">
//                         <Button
//                           type="button"
//                           variant="outline"
//                           onClick={handleResetDialogClose}
//                           disabled={isResetPending}
//                         >
//                           Cancel
//                         </Button>
//                         <Button type="submit" disabled={isResetPending}>
//                           {isResetPending ? (
//                             <>
//                               <LoadingSpinner className="mr-2 h-4 w-4" />
//                               Sending...
//                             </>
//                           ) : (
//                             "Send Reset Link"
//                           )}
//                         </Button>
//                       </DialogFooter>
//                     </form>
//                   </Form>
//                 )}

//                 {resetSuccess && (
//                   <DialogFooter>
//                     <Button onClick={handleResetDialogClose} className="w-full">
//                       Close
//                     </Button>
//                   </DialogFooter>
//                 )}
//               </DialogContent>
//             </Dialog>
//           </div>

//           <Button type="submit" className="w-full" disabled={isPending}>
//             {isPending ? (
//               <div className="flex items-center">
//                 <LoadingSpinner className="mr-2 h-4 w-4" />
//                 Signing in...
//               </div>
//             ) : (
//               "Sign In"
//             )}
//           </Button>
//         </form>
// </Form >
