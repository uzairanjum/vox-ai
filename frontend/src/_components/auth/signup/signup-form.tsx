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
import { signup } from "@/app/auth/actions/auth";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Mail,
  Lock,
  Building,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  Check,
  X
} from "lucide-react";

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
    companyName: z.string().max(100, "Company name is too long").optional(),
    acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
    marketingEmails: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

// Better error message mapping
const getErrorMessage = (error: string): string => {
  if (error.includes('User already registered')) {
    return "An account with this email already exists. Please try logging in or use a different email.";
  }
  if (error.includes('Password should be at least')) {
    return "Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.";
  }
  if (error.includes('Invalid email')) {
    return "Please enter a valid email address.";
  }
  if (error.includes('Network')) {
    return "Network error. Please check your connection and try again.";
  }
  return error || "Something went wrong. Please try again.";
};

// Password strength checker
const getPasswordStrength = (password: string) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  score = Object.values(checks).filter(Boolean).length;

  let strength = "Weak";
  let color = "bg-red-500";

  if (score >= 4) {
    strength = "Strong";
    color = "bg-green-500";
  } else if (score >= 3) {
    strength = "Medium";
    color = "bg-yellow-500";
  }

  return { score, strength, color, checks };
};

export function SignupForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordStrength, setPasswordStrength] = React.useState(getPasswordStrength(""));

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      companyName: "",
      acceptTerms: false,
      marketingEmails: false,
    },
  });

  const watchPassword = form.watch("password");

  React.useEffect(() => {
    setPasswordStrength(getPasswordStrength(watchPassword || ""));
  }, [watchPassword]);

  React.useEffect(() => {
    const firstInput = document.querySelector(
      'input[name="firstName"]'
    ) as HTMLInputElement;
    if (firstInput) firstInput.focus();
  }, []);

  const onSubmit = (values: SignupFormValues) => {

    setErrorMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("confirmPassword", values.confirmPassword);

      // Additional profile data for enhanced user profile
      const profileData = {
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName || "",
        displayName: `${values.firstName} ${values.lastName}`,
        joinedAt: new Date().toISOString(),
        preferences: {
          theme: "system",
          notifications: {
            email: values.marketingEmails || false,
            browser: true,
            marketing: values.marketingEmails || false
          },
          language: "en"
        }
      };

      formData.append("profileData", JSON.stringify(profileData));

      const result = await signup(formData);

      if (result && 'error' in result) {
        setErrorMessage(getErrorMessage(result.error));
        // If error is related to email/password, go back to step 2
        if (result.error.includes('email') || result.error.includes('password')) {
          setCurrentStep(2);
        }
      }
      // Signup action handles redirect on success
    });
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      // Validate first step fields
      const isValid = await form.trigger(["firstName", "lastName", "companyName"]);
      if (isValid) {
        setCurrentStep(2);
        // Focus on email field when moving to step 2
        setTimeout(() => {
          const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
          if (emailInput) emailInput.focus();
        }, 100);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    // Focus on first name when going back
    setTimeout(() => {
      const firstNameInput = document.querySelector('input[name="firstName"]') as HTMLInputElement;
      if (firstNameInput) firstNameInput.focus();
    }, 100);
  };

  const getProgressValue = () => {
    return currentStep === 1 ? 50 : 100;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
        <CardDescription className="text-center">
          Join us to get started with AI-powered conversations
        </CardDescription>
        <div className="pt-2">
          <Progress value={getProgressValue()} className="w-full" />
          <p className="text-xs text-muted-foreground text-center mt-2">
            Step {currentStep} of 2
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                  <User className="h-4 w-4" />
                  Personal Information
                </div>

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your first name"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your last name"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Company Name{" "}
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your company name"
                            disabled={isPending}
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full"
                  disabled={isPending}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Account Security */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                  <Shield className="h-4 w-4" />
                  Account Security
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your email"
                            disabled={isPending}
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            disabled={isPending}
                            className="pl-10 pr-10"
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

                      {/* Password Strength Indicator */}
                      {field.value && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{passwordStrength.strength}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(passwordStrength.checks).map(([key, passed]) => (
                              <div key={key} className="flex items-center gap-1">
                                {passed ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <X className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className={passed ? "text-green-600" : "text-muted-foreground"}>
                                  {key === 'length' && '8+ chars'}
                                  {key === 'lowercase' && 'lowercase'}
                                  {key === 'uppercase' && 'UPPERCASE'}
                                  {key === 'number' && '123'}
                                  {key === 'special' && '!@#'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            disabled={isPending}
                            className="pl-10 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isPending}
                          >
                            {showConfirmPassword ? (
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

                {/* Terms and Marketing */}
                <div className="space-y-3 pt-2">
                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I agree to the{" "}
                            <a href="/terms" className="text-primary underline hover:no-underline">
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" className="text-primary underline hover:no-underline">
                              Privacy Policy
                            </a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal text-muted-foreground">
                            Send me product updates and marketing emails
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="w-full"
                    disabled={isPending}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || !form.watch("acceptTerms")}
                  >
                    {isPending ? (
                      <div className="flex items-center">
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Creating account...
                      </div>
                    ) : (
                      <>
                        Create Account
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </div>
      </CardContent>
    </Card>
  );
}
