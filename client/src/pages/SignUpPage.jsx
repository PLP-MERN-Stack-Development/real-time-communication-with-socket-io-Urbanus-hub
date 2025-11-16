import { SignUp } from "@clerk/clerk-react";
import {
  MessageCircle,
  Sparkles,
  Shield,
  Zap,
  Users,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

export default function SignUpPage() {
  const [focusedField, setFocusedField] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Decorative Card */}
        <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-8 rounded-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-full">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Join Prime Chat
              </h1>
              <p className="text-gray-300">
                Create your account and start chatting
              </p>
            </div>

            {/* Features Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full">
                <Zap className="w-3 h-3" />
                <span>Instant</span>
              </div>
              <div className="flex items-center gap-1 bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1 bg-teal-500/20 text-teal-300 text-xs px-3 py-1 rounded-full">
                <Users className="w-3 h-3" />
                <span>Connect</span>
              </div>
            </div>

            {/* Clerk Sign Up Component */}
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-0 shadow-none",
                  cardBox: "bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  formFieldLabel: "text-gray-200 font-medium text-sm",
                  formFieldInput:
                    "bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg transition-all duration-300",
                  formButtonPrimary:
                    "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-2.5 rounded-lg w-full transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2",
                  footerActionLink:
                    "text-emerald-400 hover:text-emerald-300 transition-colors duration-200",
                  dividerLine: "bg-white/10",
                  dividerText: "text-gray-400 text-sm",
                  socialButtonsBlockButton:
                    "bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all duration-300",
                  formFieldSuccessText: "text-green-400",
                  formFieldErrorText: "text-red-400",
                  alertBox:
                    "bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg",
                  identityPreviewText: "text-gray-300",
                  identityPreviewEditButton:
                    "text-emerald-400 hover:text-emerald-300",
                },
              }}
              signInUrl="/signin"
            />
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Already have an account?
            <a
              href="/signin"
              className="text-emerald-400 hover:text-emerald-300 ml-1 inline-flex items-center gap-1 transition-colors duration-200"
            >
              Sign in
              <ArrowRight className="w-3 h-3" />
            </a>
          </p>
        </div>

        {/* Bottom Decorative Elements */}
        <div className="flex justify-center mt-8 gap-2">
          <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-green-500/50 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-teal-500/50 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
