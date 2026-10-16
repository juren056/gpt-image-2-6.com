import { createFileRoute } from '@tanstack/react-router';

import { agentDocumentResponse, buildLlmsFull } from '@/lib/agent-docs';

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: () =>
        agentDocumentResponse(buildLlmsFull(), {
          contentType: 'text/plain',
          canonicalPath: '/llms-full.txt',
        }),
    },
  },
});
