import { createFileRoute } from '@tanstack/react-router';

import { agentDocumentResponse, buildProductMarkdown } from '@/lib/agent-docs';

export const Route = createFileRoute('/product.md')({
  server: {
    handlers: {
      GET: () =>
        agentDocumentResponse(buildProductMarkdown(), { canonicalPath: '/' }),
    },
  },
});
