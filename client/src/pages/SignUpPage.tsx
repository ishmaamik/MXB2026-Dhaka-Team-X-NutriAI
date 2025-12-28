import { SignUp } from '@clerk/clerk-react'
import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A67B5B]/5 via-[#FAFAF8] to-[#2D5A27]/5 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#2D5A27]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A67B5B]/10 to-transparent rounded-full blur-3xl" />
      </div>
      
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-[#2D5A27] to-[#8FBC8F] rounded-xl flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:inline">NutriTrack</span>
        </Link>
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Get Started</h1>
          <p className="text-foreground/70">Create your account and start your sustainable journey</p>
        </div>
        
        <SignUp 
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-card shadow-xl rounded-2xl border border-[#E8DFD5]",
              headerTitle: "text-foreground",
              headerSubtitle: "text-foreground/70",
              socialButtonsBlockButton: "bg-card border border-[#E8DFD5] text-foreground hover:bg-[#FFF8DC]/50",
              socialButtonsBlockButtonText: "text-foreground font-medium",
              formButtonPrimary: "bg-gradient-to-r from-[#2D5A27] to-[#8FBC8F] hover:opacity-90 text-white",
              formFieldInput: "bg-[#FAFAF8] border-[#E8DFD5] text-foreground focus:border-[#2D5A27] focus:ring-[#2D5A27]",
              formFieldLabel: "text-foreground",
              footerActionLink: "text-[#2D5A27] hover:text-[#1A3A17]",
              identityPreviewText: "text-foreground",
              identityPreviewEditButtonIcon: "text-foreground/70",
              formHeaderTitle: "text-foreground",
              formHeaderSubtitle: "text-foreground/70",
              otpCodeFieldInput: "border-[#E8DFD5] text-foreground",
              formResendCodeLink: "text-[#2D5A27] hover:text-[#1A3A17]",
              footer: "hidden",
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
            },
            variables: {
              colorPrimary: "#2D5A27",
              colorBackground: "#ffffff",
              colorInputBackground: "#FAFAF8",
              colorInputText: "#3D2B1F",
              borderRadius: "0.75rem",
            }
          }}
        />
        
        <p className="text-center mt-6 text-sm text-foreground/60">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-[#2D5A27] hover:text-[#1A3A17] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}