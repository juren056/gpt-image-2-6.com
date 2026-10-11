import { createFileRoute } from '@tanstack/react-router';

import { StudioDesk } from '@/blocks/studio-desk';

function StudioPage() {
  return <StudioDesk />;
}

export const Route = createFileRoute('/settings/studio')({
  component: StudioPage,
});
