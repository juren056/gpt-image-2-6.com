import { createFileRoute } from '@tanstack/react-router';

import { agentDocumentResponse, buildPromptsMarkdown } from '@/lib/agent-docs';

export const Route = createFileRoute('/prompts.md')({
  server: {
    handlers: {
      GET: () =>
        agentDocumentResponse(buildPromptsMarkdown(), {
          canonicalPath: '/prompts',
        }),
    },
  },
});
