"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Building2, 
  User, 
  Settings, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Zap,
  MessageSquare,
  Bot,
  ExternalLink,
  Shield,
  Globe,
  RefreshCw,
  AlertCircle,
  Rocket
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Welcome } from "./welcome"
import { LoadingSpinner } from "@/components/loading/LoadingSpinner"

type UserProfile = {
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  displayName?: string
}

type OnboardingStep = {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  isOptional?: boolean
  isCompleted?: boolean
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome",
    description: "Get familiar with VOX",
    icon: <Rocket className="h-5 w-5" />,
    isCompleted: false
  },
  {
    id: 2,
    title: "Profile Setup",
    description: "Complete your profile",
    icon: <User className="h-5 w-5" />,
    isCompleted: false
  },
  {
    id: 3,
    title: "Connect LeadConnector",
    description: "Link your LeadConnector account",
    icon: <MessageSquare className="h-5 w-5" />,
    isOptional: true,
    isCompleted: false
  },
  {
    id: 4,
    title: "Create AI Agent",
    description: "Set up your first AI assistant",
    icon: <Bot className="h-5 w-5" />,
    isOptional: true,
    isCompleted: false
  }
]

type UserOnboardingProps = {
  user?: any
  initialProfile?: UserProfile
  onComplete?: () => void
}

export default function UserOnboarding({ user, initialProfile, onComplete }: UserOnboardingProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  
  const [profile, setProfile] = useState<UserProfile>({
    firstName: initialProfile?.firstName || user?.user_metadata?.firstName || "",
    lastName: initialProfile?.lastName || user?.user_metadata?.lastName || "",
    companyName: initialProfile?.companyName || user?.user_metadata?.companyName || "",
    email: user?.email || "",
    displayName: initialProfile?.displayName || user?.user_metadata?.displayName || ""
  })

  const currentStepData = steps.find(step => step.id === currentStep)
  const completedSteps = steps.filter(step => step.isCompleted).length
  const totalSteps = steps.length
  const progress = (completedSteps / totalSteps) * 100

  useEffect(() => {
    // Mark welcome as completed when user moves past it
    if (currentStep > 1 && !steps[0].isCompleted) {
      setSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, isCompleted: true } : step
      ))
    }
  }, [currentStep, steps])

  const handleWelcomeContinue = () => {
    setShowWelcome(false)
    setCurrentStep(2) // Move to profile setup
  }

  const handleSkipWelcome = () => {
    setShowWelcome(false)
    setCurrentStep(2)
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkipStep = () => {
    // Mark current step as completed (skipped)
    setSteps(prev => prev.map(step => 
      step.id === currentStep ? { ...step, isCompleted: true } : step
    ))
    handleNext()
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Save any remaining profile data
      if (profile.firstName || profile.lastName || profile.companyName) {
        await updateProfile()
      }
      
      // Mark all steps as completed
      setSteps(prev => prev.map(step => ({ ...step, isCompleted: true })))
      
      // Redirect to dashboard
      if (onComplete) {
    onComplete()
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Failed to complete onboarding. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Mark profile step as completed
      setSteps(prev => prev.map(step => 
        step.id === 2 ? { ...step, isCompleted: true } : step
      ))
    } catch (err) {
      throw new Error('Failed to save profile')
    }
  }

  const handleConnectGHL = () => {
    // Redirect to GHL OAuth
    window.location.href = '/api/leadconnector/oauth/authorize'
  }

  const handleCreateAgent = () => {
    // Navigate to agent creation
    router.push('/dashboard/app/ai/conversation-ai')
  }

  if (showWelcome) {
    return (
      <Welcome 
        userName={profile.firstName || 'there'}
        userEmail={profile.email}
        companyName={profile.companyName}
        onContinue={handleWelcomeContinue}
      />
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 2: // Profile Setup
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
              <p className="text-muted-foreground">
                Help us personalize your experience
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Your first name"
                  />
                </div>
                  <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Your last name"
                  />
                </div>
              </div>
              
                  <div>
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    value={profile.companyName}
                    onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your company name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed here
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button 
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep <= 2}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <Button 
                onClick={async () => {
                  if (profile.firstName && profile.lastName) {
                    setIsLoading(true)
                    try {
                      await updateProfile()
                      handleNext()
                    } catch (err) {
                      setError('Failed to save profile')
                    } finally {
                      setIsLoading(false)
                    }
                  } else {
                    setError('Please provide at least your first and last name')
                  }
                }}
                disabled={isLoading || !profile.firstName || !profile.lastName}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      case 3: // Connect GoHighLevel
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect LeadConnector</h3>
              <p className="text-muted-foreground">
                Link your LeadConnector account to start managing conversations with AI
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Secure Integration
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Read and manage your conversations</li>
                    <li>• Send AI-powered responses</li>
                    <li>• Access contact information</li>
                    <li>• View conversation history</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button 
                variant="outline"
                onClick={handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
            <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSkipStep}
                >
                  Skip for Now
                </Button>
                
                <Button 
                  onClick={handleConnectGHL}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Account
                </Button>
              </div>
            </div>
          </div>
        )

      case 4: // Create AI Agent
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full">
                  <Bot className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your First AI Agent</h3>
              <p className="text-muted-foreground">
                Set up an AI assistant to handle customer conversations
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-4">
                <Zap className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    AI-Powered Assistance
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Handles customer queries automatically</li>
                    <li>• Learns from your conversation history</li>
                    <li>• Provides intelligent response suggestions</li>
                    <li>• Works 24/7 to engage customers</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleSkipStep}
                >
                  Skip for Now
              </Button>
              
              <Button
                  onClick={handleCreateAgent}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                  <Bot className="mr-2 h-4 w-4" />
                  Create AI Agent
              </Button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl mx-auto shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="px-3 py-1">
              Step {currentStep} of {totalSteps}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleComplete}>
              Skip to Dashboard
            </Button>
          </div>
          
          <Progress value={progress} className="mb-6" />
          
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  step.isCompleted 
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.id === currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-muted text-muted-foreground'
                }`}>
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  step.id === currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}
          
          {currentStep === totalSteps && (
            <div className="text-center pt-6">
              <Button 
                onClick={handleComplete}
                size="lg"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Completing Setup...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Rocket className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 