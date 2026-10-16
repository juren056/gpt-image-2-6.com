import { createFileRoute } from '@tanstack/react-router';

import { agentDocumentResponse, buildIndexMarkdown } from '@/lib/agent-docs';

export const Route = createFileRoute('/index.md')({
  server: {
    handlers: {
      GET: () =>
        agentDocumentResponse(buildIndexMarkdown(), { canonicalPath: '/' }),
    },
  },
});
