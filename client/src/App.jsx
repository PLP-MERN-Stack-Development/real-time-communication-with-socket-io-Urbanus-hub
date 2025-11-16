import { SignedIn, SignedOut } from "@clerk/clerk-react";
import ChatApp from "./components/ChatApp";
import AuthPage from "./pages/AuthPage";

export default function App() {
  return (
    <>
      <SignedIn>
        <ChatApp />
      </SignedIn>
      <SignedOut>
        <AuthPage />
      </SignedOut>
    </>
  );
}
