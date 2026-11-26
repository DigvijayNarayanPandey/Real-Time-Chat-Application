import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import LandingPage from "./pages/LandingPage";
import { useAuthStore } from "./store/useAuthStore";
import { useTheme } from "./hooks/useTheme";
import PageLoader from "./components/PageLoader";
import { Toaster } from "react-hot-toast";

const ChatPage = lazy(() => import("./pages/ChatPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const location = useLocation();
  useTheme();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && location.pathname !== "/") return <PageLoader />;

  const isChatRoute = location.pathname === "/chat";

  return (
    <div
      className={`w-full bg-base-100 text-base-content relative flex flex-col ${
        isChatRoute ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh] overflow-x-hidden"
      }`}
    >
      {location.pathname !== "/" && (
        <>
          <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px] pointer-events-none" />
        </>
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/chat"
          element={
            <Suspense fallback={<PageLoader />}>
              {authUser ? <ChatPage /> : <Navigate to="/login" replace />}
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              {!authUser ? <LoginPage /> : <Navigate to="/chat" replace />}
            </Suspense>
          }
        />
        <Route
          path="/signup"
          element={
            <Suspense fallback={<PageLoader />}>
              {!authUser ? <SignUpPage /> : <Navigate to="/chat" replace />}
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}
export default App;
