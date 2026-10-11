import { useState } from 'react';
import {
  ChevronsUpDown,
  Coins,
  CreditCard,
  Gift,
  Images,
  Languages,
  LifeBuoy,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
  Zap,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type AccountMenuCopy = {
  account: string;
  credits: string;
  upgrade: string;
  billing: string;
  assets: string;
  referral: string;
  profile: string;
  theme: string;
  dark: string;
  light: string;
  language: string;
  help: string;
  logout: string;
  admin: string;
  checkIn: string;
};
export function BananaAccountMenu({
  name,
  email,
  image,
  balance,
  plan,
  copy,
  sidebar = false,
  isAdmin,
  dark,
  language,
  languages,
  onThemeChange,
  onLanguageChange,
  onUpgrade,
  onCheckIn,
  onSignOut,
}: {
  name: string;
  email: string;
  image?: string | null;
  balance: number | null;
  plan: string;
  copy: AccountMenuCopy;
  sidebar?: boolean;
  isAdmin: boolean;
  dark: boolean;
  language: string;
  languages: { code: string; label: string }[];
  onThemeChange: () => void;
  onLanguageChange: (code: string) => void;
  onUpgrade: () => void;
  onCheckIn: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const runOutsideMenu = (action: () => void) => {
    setOpen(false);
    action();
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={copy.account}
        className={`banana-account-trigger ${sidebar ? 'banana-account-trigger--sidebar' : ''}`}
      >
        {!sidebar && (
          <span className="banana-account-trigger-balance">
            <Coins size={16} />
            {balance === null ? '—' : balance.toLocaleString()}
          </span>
        )}
        <Avatar className="banana-account-avatar">
          <AvatarImage src={image || undefined} alt="" />
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        {sidebar && (
          <>
            <span className="banana-account-identity">
              <strong>{name}</strong>
              <small>{email}</small>
            </span>
            <ChevronsUpDown size={15} />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="banana-account banana-account-menu"
        align="end"
        side={sidebar ? 'top' : 'bottom'}
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="banana-account-menu-identity">
            <strong>{name}</strong>
            <span>{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <div className="banana-account-plan">
          <span>{plan}</span>
          <p>
            <strong>{balance === null ? '—' : balance.toLocaleString()}</strong>{' '}
            {copy.credits}
          </p>
          <DropdownMenuItem
            className="banana-account-plan-upgrade"
            onClick={() => runOutsideMenu(onUpgrade)}
          >
            <Zap size={15} />
            {copy.upgrade}
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings/credits" />}>
          <CreditCard />
          {copy.billing}
          <span className="banana-account-menu-trailing">
            {balance === null ? '—' : balance.toLocaleString()}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/assets" />}>
          <Images />
          {copy.assets}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/referrals" />}>
          <Gift />
          {copy.referral}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/profile" />}>
          <User />
          {copy.profile}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runOutsideMenu(onCheckIn)}>
          <Gift />
          {copy.checkIn}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onThemeChange}>
          {dark ? <Moon /> : <Sun />}
          {copy.theme}
          <span className="banana-account-menu-trailing">
            {dark ? copy.dark : copy.light}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages />
            {copy.language}
            <span className="banana-account-menu-trailing">
              {languages.find((item) => item.code === language)?.label}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="banana-account banana-account-menu banana-account-language">
            {languages.map((item) => (
              <DropdownMenuItem
                key={item.code}
                onClick={() => onLanguageChange(item.code)}
                aria-current={language === item.code ? 'true' : undefined}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings/tickets" />}>
          <LifeBuoy />
          {copy.help}
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <Shield />
            {copy.admin}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut />
          {copy.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
