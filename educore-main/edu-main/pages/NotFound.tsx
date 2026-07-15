import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="text-center px-6 max-w-md">
        <img
          src="/eduquest-logo.png"
          alt="EduQuest"
          className="w-20 h-20 object-contain mx-auto mb-6"
        />
        <h1 className="text-7xl font-black text-violet-600 mb-2">404</h1>
        <p className="text-2xl font-bold text-gray-800 mb-2">Quest Not Found!</p>
        <p className="text-muted-foreground mb-8">
          The page <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{location.pathname}</code> doesn't exist.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #8b5cf6, #a78bfa)",
            boxShadow: "0 8px 30px rgba(124, 58, 237, 0.3)",
          }}
        >
          🏠 Return Home
        </a>
        <p className="text-sm text-muted-foreground mt-6">
          Redirecting in <span className="font-bold text-violet-600">{countdown}s</span>…
        </p>
      </div>
    </div>
  );
};

export default NotFound;
