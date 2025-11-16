import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import ChatApp from './components/ChatApp';

export default function App() {
  return (
    <>
      <SignedIn>
        <ChatApp />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}