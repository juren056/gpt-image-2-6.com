import { createFileRoute } from '@tanstack/react-router';

async function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'image-studio',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    }
  );
}

export const Route = createFileRoute('/api/health')({
  server: { handlers: { GET } },
});
