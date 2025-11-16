import { SignIn } from "@clerk/clerk-react";
import { MessageCircle, Zap, Users, Lock } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Side - Features & Info */}
          <div className="space-y-6 text-white hidden md:block">
            <div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Swift Chat
              </h1>
              <p className="text-xl text-gray-300">
                Real-time messaging made simple and fast
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-green-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Instant Messaging</h3>
                  <p className="text-gray-400">
                    Send and receive messages in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-emerald-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Group Chats</h3>
                  <p className="text-gray-400">
                    Chat with multiple users at once
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-teal-500/20 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Online Status</h3>
                  <p className="text-gray-400">
                    See who's online and ready to chat
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-lime-500/20 rounded-lg">
                  <Lock className="w-5 h-5 text-lime-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Secure & Private</h3>
                  <p className="text-gray-400">
                    Your conversations are always private
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-8 border-t border-emerald-500/30 grid grid-cols-3 gap-4">
              <div>
                <div className="text-3xl font-bold text-green-400">Instant</div>
                <div className="text-sm text-gray-400">Real-time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-400">Secure</div>
                <div className="text-sm text-gray-400">Encrypted</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-400">Simple</div>
                <div className="text-sm text-gray-400">Easy to use</div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl">
            <div className="md:hidden mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Prime Chat</h1>
              <p className="text-gray-300">Real-time messaging</p>
            </div>

            {/* Clerk Sign In Component */}
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-0 shadow-none",
                  cardBox: "bg-transparent",
                  headerTitle: "text-white text-2xl font-bold mb-2",
                  headerSubtitle: "text-gray-300",
                  formFieldLabel: "text-gray-200 font-medium",
                  formFieldInput:
                    "bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500",
                  formButtonPrimary:
                    "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-lg",
                  footerActionLink: "text-green-400 hover:text-green-300",
                  dividerLine: "bg-white/10",
                  dividerText: "text-gray-400",
                  socialButtonsBlockButton:
                    "bg-white/10 border border-white/20 hover:bg-white/20 text-white",
                  formResendCodeLink: "text-green-400 hover:text-green-300",
                  formFieldSuccessText: "text-green-400",
                  formFieldErrorText: "text-red-400",
                  alertBox:
                    "bg-red-500/10 border border-red-500/30 text-red-300",
                },
              }}
              signUpUrl="/signup"
            />
          </div>
        </div>
      </div>
    </div>
  );
}