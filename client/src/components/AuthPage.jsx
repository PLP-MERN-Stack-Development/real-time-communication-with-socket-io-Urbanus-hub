import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">ChatApp</h1>
          <p className="text-blue-100">Connect, Chat, Collaborate</p>
        </div>

        {/* Clerk Sign In/Up Component */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {isSignUp ? (
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none",
                }
              }}
              routing="path"
              path="/sign-up"
            />
          ) : (
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none",
                }
              }}
              routing="path"
              path="/sign-in"
            />
          )}
        </div>

        {/* Toggle Sign In/Up */}
        <div className="text-center mt-6">
          <p className="text-white">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold underline hover:text-blue-200 transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-white">
            <div className="text-2xl font-bold">🔒</div>
            <p className="text-xs mt-1 text-blue-100">Secure</p>
          </div>
          <div className="text-white">
            <div className="text-2xl font-bold">⚡</div>
            <p className="text-xs mt-1 text-blue-100">Fast</p>
          </div>
          <div className="text-white">
            <div className="text-2xl font-bold">🌐</div>
            <p className="text-xs mt-1 text-blue-100">Real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;