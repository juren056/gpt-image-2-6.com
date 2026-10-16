import { createFileRoute } from '@tanstack/react-router';

import { agentDocumentResponse, buildPricingMarkdown } from '@/lib/agent-docs';

export const Route = createFileRoute('/pricing.md')({
  server: {
    handlers: {
      GET: () =>
        agentDocumentResponse(buildPricingMarkdown(), {
          canonicalPath: '/pricing',
        }),
    },
  },
});
