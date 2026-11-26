import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MailIcon, UserIcon, LoaderIcon } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const { signup, isSigningUp } = useAuthStore();

  const validate = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    }
    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    signup({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up for a new account"
      footerLinkTo="/login"
      footerLinkText="Already have an account? Login"
      illustrationSrc="/signup.png"
      illustrationAlt="People using app"
      illustrationHeading="Start Your Journey Today"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="signup-fullname" className="auth-input-label">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="auth-input-icon" />
            <input
              id="signup-fullname"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="auth-input"
              placeholder="John Doe"
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
            />
          </div>
          {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="signup-email" className="auth-input-label">
            Email
          </label>
          <div className="relative">
            <MailIcon className="auth-input-icon" />
            <input
              id="signup-email"
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
          id="signup-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          autoComplete="new-password"
          error={errors.password}
        />

        <button className="auth-btn" type="submit" disabled={isSigningUp}>
          {isSigningUp ? (
            <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
export default SignUpPage;
