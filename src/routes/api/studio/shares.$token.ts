import { createFileRoute } from '@tanstack/react-router';

import { getProjectShare } from '@/modules/creative-projects/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ params }: { params: { token: string } }) {
  const share = await getProjectShare(params.token);
  return share ? respData(share) : respErr('Share not found');
}

export const Route = createFileRoute('/api/studio/shares/$token')({
  server: { handlers: { GET } },
});
