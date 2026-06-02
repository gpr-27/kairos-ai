import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

import { ContinueAsGuest } from '@/components/auth/continue-as-guest';
import { Backdrop } from '@/components/brand/backdrop';
import { Logo } from '@/components/brand/logo';

export default function SignInPage(): JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <Backdrop />

      <Link to="/" className="mb-6">
        <Logo size="lg" />
      </Link>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1 inline-flex items-center gap-1.5 text-sm">
          <Zap className="h-3.5 w-3.5 text-violet-400" />
          Your Groq-powered coach is ready
        </p>
      </div>

      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/onboarding"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'bg-card border border-border shadow-2xl',
            headerTitle: '!text-foreground',
            headerSubtitle: '!text-muted-foreground',
            socialButtonsBlockButton:
              '!border-border !bg-background !text-foreground hover:!bg-accent/10',
            socialButtonsBlockButtonText: '!text-foreground',
            socialButtonsProviderIcon: '!opacity-100',
            dividerLine: '!bg-border',
            dividerText: '!text-muted-foreground',
            formFieldLabel: '!text-foreground',
            formFieldInput:
              '!bg-background !border-border !text-foreground placeholder:!text-muted-foreground focus:!ring-2 focus:!ring-primary',
            formButtonPrimary:
              '!bg-gradient-to-r !from-violet-600 !to-fuchsia-600 hover:!brightness-110 !text-white',
            footerActionLink: '!text-primary hover:!text-primary/80',
            identityPreviewText: '!text-foreground',
            formResendCodeLink: '!text-primary',
            // Hide phone strategy switch in the form UI.
            formFieldAction: '!hidden',
            formFieldRow__phoneNumber: '!hidden',
            formFieldInput__phoneNumber: '!hidden',
          },
          variables: {
            colorPrimary: 'hsl(263, 80%, 65%)',
            colorBackground: 'hsl(240, 10%, 5.9%)',
            colorText: 'hsl(0, 0%, 98%)',
            colorTextSecondary: 'hsl(240, 5%, 64.9%)',
            colorInputText: 'hsl(0, 0%, 98%)',
            colorInputBackground: 'hsl(240, 6%, 10%)',
            colorNeutral: 'hsl(240, 4%, 46%)',
          },
        }}
      />

      <ContinueAsGuest />
    </div>
  );
}
