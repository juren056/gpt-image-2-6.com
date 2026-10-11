export const NANO_SITE_PAGES = {
  home: { path: '/', sections: 10, faqs: 6 },
  prompts: { path: '/prompts', sections: 5, faqs: 3 },
  comparison: { path: '/posts/nano-banana-21-vs-pro', sections: 5, faqs: 3 },
  pricing: { path: '/pricing', sections: 4, faqs: 2 },
  api: { path: '/api', sections: 4, faqs: 2 },
  free: { path: '/free', sections: 4, faqs: 2 },
  science: { path: '/scientific-figures', sections: 5, faqs: 3 },
  editor: { path: '/editor', sections: 4, faqs: 2 },
  guide: { path: '/guide', sections: 5, faqs: 3 },
  migration: { path: '/guide/nano-banana-2-to-2-1', sections: 4, faqs: 3 },
  pro: { path: '/nano-banana-pro', sections: 4, faqs: 2 },
  versus2: { path: '/vs-2', sections: 5, faqs: 3 },
  versusGpt: { path: '/vs-gpt-image', sections: 5, faqs: 3 },
  mcp: { path: '/mcp', sections: 5, faqs: 3 },
  logo: { path: '/logo', sections: 5, faqs: 3 },
  blog: { path: '/blog', sections: 3, faqs: 2 },
  blogProduct: { path: '/blog/product-photo-prompts', sections: 4, faqs: 2 },
  blogText: { path: '/blog/readable-text-in-ai-images', sections: 4, faqs: 2 },
  blogReferences: { path: '/blog/consistent-characters', sections: 4, faqs: 2 },
  blogExport: { path: '/blog/image-export-resolution', sections: 4, faqs: 2 },
  blogRights: {
    path: '/blog/commercial-use-and-watermarks',
    sections: 4,
    faqs: 2,
  },
} as const;

export type NanoPageId = keyof typeof NANO_SITE_PAGES;
export const NANO_SITE_REVIEW_DATE = '2026-10-10';

export const NANO_SITE_SOURCES = [
  {
    label: 'Google: Nano Banana 2.1',
    href: 'https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1',
  },
  {
    label: 'Google: model lifecycle',
    href: 'https://ai.google.dev/gemini-api/docs/deprecations',
  },
  {
    label: 'fal: Nano Banana 2.1 API',
    href: 'https://fal.ai/models/google/nano-banana-2.1/api',
  },
  {
    label: 'fal: reference editing API',
    href: 'https://fal.ai/models/google/nano-banana-2.1/edit/api',
  },
] as const;

export const NANO_PAGE_SOURCES: Partial<
  Record<NanoPageId, readonly { label: string; href: string }[]>
> = {
  versusGpt: [
    NANO_SITE_SOURCES[0],
    {
      label: 'fal: GPT Image 2.5 workflows',
      href: 'https://fal.ai/gpt-image-2.5',
    },
  ],
  mcp: [
    {
      label: 'MCP: architecture',
      href: 'https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture',
    },
    {
      label: 'MCP: security practices',
      href: 'https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices',
    },
    NANO_SITE_SOURCES[2],
  ],
  blogRights: [
    {
      label: 'Google: image generation and SynthID',
      href: 'https://ai.google.dev/gemini-api/docs/image-generation',
    },
    {
      label: 'Google: Gemini API terms',
      href: 'https://ai.google.dev/gemini-api/terms',
    },
    {
      label: 'fal: terms of service',
      href: 'https://fal.ai/legal/terms-of-service',
    },
  ],
};

export const NANO_API_SAMPLE = `# Run on your server with your own fal credential.
# Submits a billable provider task when executed with a valid key.
curl --request POST 'https://queue.fal.run/google/nano-banana-2.1' \\
  --header "Authorization: Key $FAL_KEY" \\
  --header 'Content-Type: application/json' \\
  --data '{"prompt":"A cobalt bottle on pale stone, soft side light, no text","aspect_ratio":"1:1","resolution":"1K","output_format":"png","num_images":1}'

# Save the returned request_id and use the documented status_url
# and response_url to follow the task. Do not repeat an ambiguous POST.`;
