import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowUpRight, House, Menu, Search, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { DEFAULT_APP_LOGO } from '@/config/brand';
import type { ToolCatalogItem } from '@/lib/tools';
import { ToolIcon } from '@/components/tool-icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export type CreativeHomeTool = ToolCatalogItem & {
  title: string;
  description: string;
};
export type CreativeHomeCopy = {
  home: string;
  tools: string;
  search: string;
  empty: string;
  pricing: string;
  prompts: string;
  signIn: string;
  menu: string;
  create: string;
  explore: string;
};

export function CreativeHomeShell({
  name,
  logo,
  tools,
  copy,
  controls,
  signedIn = false,
  children,
}: {
  name: string;
  logo: string;
  tools: CreativeHomeTool[];
  copy: CreativeHomeCopy;
  controls: ReactNode;
  signedIn?: boolean;
  children: ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const filtered = useMemo(
    () =>
      tools.filter((tool) =>
        `${tool.title} ${tool.description} ${tool.keywords.join(' ')}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase().trim())
      ),
    [tools, query]
  );
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    if (searchOpen)
      document
        .getElementById(`creative-tool-${active}`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [active, searchOpen, query]);
  const nav = (
    <>
      <Link
        href="/"
        onClick={closeMenu}
        className="flex items-center gap-3 px-3 py-3 font-semibold"
      >
        <img
          src={logo || DEFAULT_APP_LOGO}
          alt=""
          className="size-8 rounded-lg bg-white p-1"
        />
        <span className="truncate">{name}</span>
      </Link>
      <button
        onClick={() => {
          setMenuOpen(false);
          setQuery('');
          setActive(0);
          setSearchOpen(true);
        }}
        className="my-4 flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-left text-sm text-white/70 hover:bg-white/10"
      >
        <Search className="size-4" />
        <span className="flex-1">{copy.search}</span>
        <kbd className="text-[10px]">⌘ K</kbd>
      </button>
      <nav aria-label={copy.tools} className="space-y-1">
        <Link
          href="/"
          onClick={closeMenu}
          aria-current="page"
          className="flex min-h-11 items-center gap-3 rounded-xl bg-white/12 px-3 text-sm font-medium"
        >
          <House className="size-4" />
          {copy.home}
        </Link>
        <p className="px-3 pt-5 pb-2 text-xs text-white/45">{copy.create}</p>
        {tools
          .filter((tool) => !tool.isPreview)
          .slice(0, 7)
          .map((tool) => (
            <Link
              key={tool.kind}
              href={tool.href}
              onClick={closeMenu}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/75 transition-colors hover:bg-white/8 hover:text-white"
            >
              <ToolIcon name={tool.icon} className="size-4 shrink-0" />
              <span className="truncate">{tool.title}</span>
            </Link>
          ))}
        <p className="px-3 pt-5 pb-2 text-xs text-white/45">{copy.explore}</p>
        <Link
          href="/prompts"
          onClick={closeMenu}
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/75 hover:bg-white/8"
        >
          <Sparkles className="size-4" />
          {copy.prompts}
        </Link>
        <Link
          href="/pricing"
          onClick={closeMenu}
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/75 hover:bg-white/8"
        >
          <ArrowUpRight className="size-4" />
          {copy.pricing}
        </Link>
      </nav>
      {!signedIn && (
        <Link
          href="/sign-in"
          onClick={closeMenu}
          className="mt-auto flex min-h-11 items-center justify-center rounded-xl bg-white text-sm font-semibold text-black hover:bg-white/90"
        >
          {copy.signIn}
        </Link>
      )}
    </>
  );
  return (
    <div className="creative-home bg-background text-foreground min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col overflow-y-auto bg-[#141416] px-3 py-4 text-white lg:flex">
        {nav}
      </aside>
      <div className="min-w-0 lg:pl-56">
        <header className="bg-background/95 border-border sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-lg sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="hover:bg-muted flex size-10 items-center justify-center rounded-lg lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label={copy.menu}
            >
              <Menu className="size-5" />
            </button>
            <span className="truncate text-sm font-semibold">{copy.home}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">{controls}</div>
        </header>
        {children}
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(18rem,88vw)] flex-col overflow-y-auto bg-[#141416] px-3 py-4 text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{copy.menu}</SheetTitle>
          </SheetHeader>
          {nav}
        </SheetContent>
      </Sheet>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="creative-home max-h-[85dvh] overflow-hidden p-5 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{copy.search}</DialogTitle>
          </DialogHeader>
          <div className="border-border flex items-center gap-3 rounded-xl border px-3">
            <Search className="text-muted-foreground size-5" />
            <input
              autoFocus
              value={query}
              aria-label={copy.search}
              aria-controls="creative-tool-results"
              role="combobox"
              aria-expanded={searchOpen}
              aria-autocomplete="list"
              aria-activedescendant={
                filtered.length ? `creative-tool-${active}` : undefined
              }
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActive((index) =>
                    filtered.length
                      ? (index +
                          (event.key === 'ArrowDown' ? 1 : -1) +
                          filtered.length) %
                        filtered.length
                      : 0
                  );
                }
                if (event.key === 'Enter') {
                  event.preventDefault();
                  document.getElementById(`creative-tool-${active}`)?.click();
                }
              }}
            />
          </div>
          <div
            id="creative-tool-results"
            role="listbox"
            aria-label={copy.tools}
            className="max-h-[50dvh] overflow-y-auto"
            aria-live="polite"
          >
            {filtered.length ? (
              filtered.map((tool, index) => (
                <Link
                  id={`creative-tool-${index}`}
                  role="option"
                  aria-selected={index === active}
                  key={tool.kind}
                  href={tool.href}
                  onClick={() => setSearchOpen(false)}
                  className={`flex items-center gap-4 rounded-xl p-3 ${index === active ? 'bg-muted' : 'hover:bg-muted/60'}`}
                >
                  <span className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <ToolIcon name={tool.icon} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {tool.title}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {tool.description}
                    </span>
                  </span>
                  <ArrowUpRight className="text-muted-foreground ml-auto size-4 shrink-0" />
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {copy.empty}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
