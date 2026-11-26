import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MailIcon, LoaderIcon } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const { login, isLoggingIn } = useAuthStore();

  const validate = () => {
    const nextErrors = {};
    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      nextErrors.password = "Password is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    login({
      email: formData.email.trim(),
      password: formData.password,
    });
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to access your account"
      footerLinkTo="/signup"
      footerLinkText="Don't have an account? Sign Up"
      illustrationSrc="/login.png"
      illustrationAlt="People chatting"
      illustrationHeading="Connect anytime, anywhere"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="login-email" className="auth-input-label">
            Email
          </label>
          <div className="relative">
            <MailIcon className="auth-input-icon" />
            <input
              id="login-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="auth-input"
              placeholder="johndoe@gmail.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
        </div>

        <PasswordInput
          id="login-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          autoComplete="current-password"
          error={errors.password}
        />

        <button className="auth-btn" type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? <LoaderIcon className="w-5 h-5 animate-spin mx-auto" /> : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
export default LoginPage;
