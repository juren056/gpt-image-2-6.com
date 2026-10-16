import { createFileRoute } from '@tanstack/react-router';

import {
  agentDocumentResponse,
  buildEvaluationMarkdown,
} from '@/lib/agent-docs';

export const Route = createFileRoute('/evaluation-method.md')({
  server: {
    handlers: {
      GET: () =>
        agentDocumentResponse(buildEvaluationMarkdown(), {
          canonicalPath: '/evaluation-method',
        }),
    },
  },
});
