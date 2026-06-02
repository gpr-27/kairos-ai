import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createGuestSession } from '@/lib/guest-api';
import { useGuestStore } from '@/stores/guest-store';

/** "Continue as Guest" — creates an anonymous session and enters the app. */
export function ContinueAsGuest(): JSX.Element {
  const navigate = useNavigate();
  const setGuest = useGuestStore((s) => s.setGuest);
  const [loading, setLoading] = useState(false);

  async function handleClick(): Promise<void> {
    setLoading(true);
    try {
      const session = await createGuestSession();
      setGuest(session.guestId, session.token);
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Could not start a guest session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="my-5 flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <span className="bg-border h-px flex-1" />
      </div>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => void handleClick()}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCircle2 className="h-4 w-4" />}
        Continue as Guest
      </Button>
      <p className="text-muted-foreground mt-2 text-center text-xs">
        Try Kairos instantly — your work is saved. Create an account later to keep it forever.
      </p>
    </div>
  );
}
