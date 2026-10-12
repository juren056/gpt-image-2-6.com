import { useState } from 'react';
import {
  ArrowUpRight,
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
            <Avatar className="banana-account-menu-avatar">
              <AvatarImage src={image || undefined} alt="" />
              <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="banana-account-menu-person">
              <strong title={name}>{name}</strong>
              <span title={email}>{email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <div className="banana-account-plan">
          <div className="banana-account-pass-heading">
            <span className="banana-account-pass-mark" aria-hidden="true">
              <Coins size={18} />
            </span>
            <span className="banana-account-plan-badge" title={plan}>
              {plan}
            </span>
          </div>
          <p className="banana-account-pass-balance" aria-live="polite">
            <span>{copy.credits}</span>
            <strong>{balance === null ? '—' : balance.toLocaleString()}</strong>
          </p>
          <DropdownMenuItem
            className="banana-account-plan-upgrade"
            onClick={() => runOutsideMenu(onUpgrade)}
          >
            <Zap size={15} />
            <span>{copy.upgrade}</span>
            <ArrowUpRight
              className="banana-account-upgrade-arrow"
              aria-hidden="true"
            />
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings/credits" />}>
          <CreditCard />
          <span>{copy.billing}</span>
          <span className="banana-account-menu-trailing">
            {balance === null ? '—' : balance.toLocaleString()}
          </span>
        </DropdownMenuItem>
        <DropdownMenuGroup className="banana-account-shortcuts">
          <DropdownMenuItem render={<Link href="/settings/assets" />}>
            <Images />
            <span>{copy.assets}</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings/referrals" />}>
            <Gift />
            <span>{copy.referral}</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings/profile" />}>
            <User />
            <span>{copy.profile}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runOutsideMenu(onCheckIn)}>
            <Gift />
            <span>{copy.checkIn}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onThemeChange}>
          {dark ? <Moon /> : <Sun />}
          <span>{copy.theme}</span>
          <span className="banana-account-menu-trailing">
            {dark ? copy.dark : copy.light}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages />
            <span>{copy.language}</span>
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
        <DropdownMenuGroup className="banana-account-menu-footer">
          <DropdownMenuItem render={<Link href="/settings/tickets" />}>
            <LifeBuoy />
            <span>{copy.help}</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem render={<Link href="/admin" />}>
              <Shield />
              <span>{copy.admin}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut />
            <span>{copy.logout}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
