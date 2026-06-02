import { GuestUpgradeCard } from '@/components/auth/guest-upgrade-card';
import { useAppAuth } from '@/hooks/use-app-auth';
import { useTheme } from '@/providers/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const { isGuest } = useAppAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Customize how Kairos looks and behaves.</p>
      </header>

      <div className="mt-8 space-y-6">
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Pick the look that's easiest on your eyes during long solve sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-muted-foreground text-sm">Dark, light, or follow system.</p>
              </div>
              <Select value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isGuest ? (
          <GuestUpgradeCard
            title="You're using a guest account"
            description="Sign up to manage your account and keep your work forever. Your guest chats and submissions move over automatically when you create an account."
          />
        ) : (
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Email, password, and connected providers are managed via Clerk's user profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Click your avatar in the top-right corner to open Clerk's account modal.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
