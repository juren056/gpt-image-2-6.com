import { AccountUserMenu } from '@/blocks/banana-account-menu';

/** Compatibility entry point for public headers using the shared account menu. */
export function SiteUserMenu(props: {
  name: string;
  email: string;
  image?: string | null;
}) {
  return <AccountUserMenu {...props} />;
}
