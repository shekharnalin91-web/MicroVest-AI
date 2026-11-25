
import { useState, type FormEvent } from "react";
import API from "../services/api";
import { Wallet, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

type AuthProps = {
  onAuthenticated: (token: string, user: {
    id: string;
    name: string;
    email: string;
  }) => void;
};

export default function Auth({ onAuthenticated }: AuthProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await API.post("/auth/signup", {
          name,
          email,
          password,
        });

        setIsSignup(false);
        setPassword("");
        setError("Account created! Please log in.");
      } else {
        const response = await API.post("/auth/login", {
          email,
          password,
        });

        onAuthenticated(
          response.data.access_token,
          response.data.user
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

        <div className="flex justify-center mb-5">
          <div className="bg-blue-100 p-4 rounded-2xl">
            <Wallet size={35} className="text-blue-700" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-slate-900">
          MicroVest AI
        </h1>

        <p className="text-center text-slate-500 mt-2 mb-8">
          Your personal financial companion
        </p>

        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {isSignup ? "Create your account" : "Welcome back!"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={19} />
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={19} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full border rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={19} />
              <input
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full border rounded-xl py-3 pl-11 pr-12 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-center text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Login"}
          </button>

        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="ml-2 text-blue-700 font-semibold hover:underline"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>

      </div>
    </div>
  );
}

