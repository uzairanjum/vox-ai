"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Zap, 
  User, 
  Settings, 
  ArrowRight, 
  MessageSquare, 
  Bot, 
  BarChart3, 
  BookOpen, 
  Rocket,
  CheckCircle2,
  ArrowLeft,
  Play,
  Clock,
  Shield
} from "lucide-react"

type WelcomeProps = {
  userName?: string
  userEmail?: string
  companyName?: string
  onContinue: () => void
}

type OnboardingStep = {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  color: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to VOX",
    description: "Your AI-powered conversation platform is ready to transform how you communicate with customers.",
    icon: <Rocket className="h-8 w-8" />,
    features: [
      "AI-powered conversation intelligence",
      "Advanced automation capabilities", 
      "Real-time analytics and insights",
      "Seamless team collaboration"
    ],
    color: "from-blue-500 to-purple-600"
  },
  {
    id: 2,
    title: "Smart Conversations",
    description: "Connect your LeadConnector account and let AI handle customer conversations intelligently.",
    icon: <MessageSquare className="h-8 w-8" />,
    features: [
      "Automatic conversation training",
      "Intelligent response suggestions",
      "Context-aware AI assistance",
      "Multi-platform support"
    ],
    color: "from-green-500 to-teal-600"
  },
  {
    id: 3,
    title: "AI Agents & Automation",
    description: "Create custom AI agents that work around the clock to engage your customers.",
    icon: <Bot className="h-8 w-8" />,
    features: [
      "Custom AI agent creation",
      "Autopilot conversation mode",
      "Personalized responses",
      "24/7 customer engagement"
    ],
    color: "from-orange-500 to-red-600"
  },
  {
    id: 4,
    title: "Analytics & Insights",
    description: "Track performance, understand customer behavior, and optimize your communication strategy.",
    icon: <BarChart3 className="h-8 w-8" />,
    features: [
      "Conversation analytics",
      "Performance metrics",
      "Customer insights",
      "ROI tracking"
    ],
    color: "from-purple-500 to-pink-600"
  }
]

export function Welcome({ userName, userEmail, companyName, onContinue }: WelcomeProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isStarted, setIsStarted] = useState(false)

  const currentStepData = onboardingSteps.find(step => step.id === currentStep)
  const progress = (currentStep / onboardingSteps.length) * 100

  const handleNext = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      onContinue()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onContinue()
  }

  const handleStart = () => {
    setIsStarted(true)
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
                <Zap className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {userName ? `Welcome to VOX, ${userName}!` : "Welcome to VOX!"}
            </CardTitle>
            <CardDescription className="text-xl mt-4 max-w-2xl mx-auto">
              You've successfully joined the future of AI-powered conversation management. 
              Let's get you set up in less than 2 minutes.
            </CardDescription>
            
            {/* User Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 mt-6 max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{userName}</p>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                  {companyName && (
                    <p className="text-xs text-muted-foreground">{companyName}</p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">2 min</p>
                <p className="text-xs text-muted-foreground">Setup Time</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                <Shield className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Secure</p>
                <p className="text-xs text-muted-foreground">Enterprise-grade</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
                <Bot className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">AI-Powered</p>
                <p className="text-xs text-muted-foreground">Smart automation</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
                <Zap className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">24/7</p>
                <p className="text-xs text-muted-foreground">Always active</p>
              </div>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold mb-2">Smart Conversations</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered conversation management with intelligent responses
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-green-200 dark:border-gray-600">
                <Bot className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-2">AI Agents</h3>
                <p className="text-sm text-muted-foreground">
                  Custom AI agents that work around the clock
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-purple-200 dark:border-gray-600">
                <BarChart3 className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Deep insights and performance tracking
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-orange-200 dark:border-gray-600">
                <BookOpen className="h-8 w-8 mx-auto mb-3 text-orange-600" />
                <h3 className="font-semibold mb-2">Knowledge Base</h3>
                <p className="text-sm text-muted-foreground">
                  Train AI with your business knowledge
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center pt-6 space-y-4">
              <Button 
                onClick={handleStart}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-8 py-3"
              >
                <Play className="h-5 w-5" />
                Start Quick Tour
              </Button>
              
              <div className="flex items-center justify-center gap-4">
                <Button 
                  variant="outline"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip & Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="px-3 py-1">
              Step {currentStep} of {onboardingSteps.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
          
          <Progress value={progress} className="mb-6" />
          
          {currentStepData && (
            <>
              <div className="mx-auto mb-6">
                <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${currentStepData.color} rounded-full shadow-lg text-white`}>
                  {currentStepData.icon}
                </div>
              </div>
              
              <CardTitle className="text-3xl font-bold mb-4">
                {currentStepData.title}
              </CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                {currentStepData.description}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-8">
          {currentStepData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStepData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6">
            <Button 
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {onboardingSteps.map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step.id === currentStep 
                      ? 'bg-primary' 
                      : step.id < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <Button 
              onClick={handleNext}
              className={`flex items-center gap-2 ${
                currentStep === onboardingSteps.length 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                  : ''
              }`}
            >
              {currentStep === onboardingSteps.length ? (
                <>
                  Get Started
                  <Rocket className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 