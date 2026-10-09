import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';
import { CreativeStudioWorkspace } from '@/components/creative-studio-workspace';

function StudioPage() {
  return (
    <div>
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {m['settings.studio.title']()}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {m['settings.studio.description']()}
        </p>
      </div>
      <CreativeStudioWorkspace />
    </div>
  );
}

export const Route = createFileRoute('/settings/studio')({
  component: StudioPage,
});
