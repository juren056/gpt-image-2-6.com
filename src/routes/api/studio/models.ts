import { createFileRoute } from '@tanstack/react-router';

import { getCreativeModelAvailability } from '@/modules/images/service';
import { respData, respErr } from '@/lib/resp';

async function GET() {
  try {
    return respData(await getCreativeModelAvailability());
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to load models'
    );
  }
}

export const Route = createFileRoute('/api/studio/models')({
  server: { handlers: { GET } },
});
