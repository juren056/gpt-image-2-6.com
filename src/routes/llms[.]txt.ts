import { createFileRoute } from '@tanstack/react-router';

import { agentDocumentResponse, buildLlmsIndex } from '@/lib/agent-docs';

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () =>
        agentDocumentResponse(buildLlmsIndex(), {
          contentType: 'text/plain',
          canonicalPath: '/llms.txt',
        }),
    },
  },
});
