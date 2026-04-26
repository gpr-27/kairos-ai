import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

import { Logo } from '@/components/brand/logo';

export default function SignUpPage(): JSX.Element {
  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-600/25 via-fuchsia-600/10 to-transparent blur-3xl" />
      </div>

      <Link to="/" className="mb-8">
        <Logo size="lg" />
      </Link>

      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
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
            // Hide phone strategy fields in the form UI.
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
    </div>
  );
}
