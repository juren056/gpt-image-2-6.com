import { createFileRoute } from '@tanstack/react-router';

import { agentDocumentResponse, buildFaqMarkdown } from '@/lib/agent-docs';

export const Route = createFileRoute('/faq.md')({
  server: {
    handlers: {
      GET: () =>
        agentDocumentResponse(buildFaqMarkdown(), { canonicalPath: '/' }),
    },
  },
});
