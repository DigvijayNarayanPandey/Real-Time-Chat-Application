import { MessageCircleIcon } from "lucide-react";
import { Link } from "react-router";

function AuthLayout({
  title,
  subtitle,
  children,
  footerLinkTo,
  footerLinkText,
  illustrationSrc,
  illustrationAlt,
  illustrationHeading,
}) {
  return (
    <div className="w-full min-h-[100dvh] flex flex-col md:flex-row bg-base-100 text-base-content">
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
              <MessageCircleIcon className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-base-content mb-1">{title}</h1>
            <p className="text-base-content/70 text-sm">{subtitle}</p>
          </div>

          {children}

          <div className="mt-6 text-center">
            <Link to={footerLinkTo} className="auth-link">
              {footerLinkText}
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:w-1/2 items-center justify-center p-8 bg-gradient-to-bl from-base-200/30 to-transparent border-l border-base-content/10">
        <div className="text-center">
          <img
            src={illustrationSrc}
            alt={illustrationAlt}
            className="w-full max-w-xs h-auto object-contain mx-auto"
          />
          <h2 className="text-xl font-semibold text-cyan-400 mt-6">{illustrationHeading}</h2>
          <div className="mt-4 flex justify-center gap-3">
            <span className="auth-badge">Free</span>
            <span className="auth-badge">Easy Setup</span>
            <span className="auth-badge">Private</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
