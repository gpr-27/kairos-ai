import { Link } from 'react-router-dom';
import { Sparkles, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GuestUpgradeCardProps {
  title?: string;
  description?: string;
}

/** CTA shown to guests on account-only surfaces (profile, account settings). */
export function GuestUpgradeCard({
  title = 'Create an account to continue',
  description = 'Create an account to permanently save and sync your work across devices. Your current guest chats and submissions will move over automatically.',
}: GuestUpgradeCardProps): JSX.Element {
  return (
    <Card className="border-border/60 bg-card/50">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="rounded-full bg-violet-500/10 p-3">
          <Sparkles className="h-6 w-6 text-violet-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">{description}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="gradient">
            <Link to="/sign-up">
              <UserPlus className="h-4 w-4" />
              Create account
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
