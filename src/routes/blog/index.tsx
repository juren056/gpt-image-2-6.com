import { createFileRoute } from '@tanstack/react-router';

import { getNanoSiteDataFn } from '@/lib/nano-site-data';
import { nanoSiteRouteOptions } from '@/lib/nano-site-routes';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { NanoSitePage } from '@/blocks/nano-site';
import { BlogCard } from '@/components/blog-card';
import { formatPostDate } from '@/content/posts';
import { getBlogPostsFn } from '@/content/posts/server';

export const Route = createFileRoute('/blog/')({
  ...nanoSiteRouteOptions('blog'),
  loader: async () => {
    const locale = getLocale();
    const [presentation, posts] = await Promise.all([
      getNanoSiteDataFn({ data: { id: 'blog', locale } }),
      getBlogPostsFn({ data: { locale } }),
    ]);
    return { ...presentation, posts };
  },
  component: BlogPage,
});

function BlogPage() {
  const presentation = Route.useLoaderData();
  const { locale, posts } = presentation;

  return (
    <NanoSitePage id="blog" presentation={presentation}>
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
              {m['blog.title']()}
            </h2>
            <p className="text-muted-foreground mx-auto mt-5 max-w-lg">
              {m['blog.description']()}
            </p>
          </div>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center">
              {m['blog.no_posts']()}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  title={post.title}
                  description={post.description}
                  image={post.image}
                  date={formatPostDate(post.createdAt, locale)}
                  authorName={post.authorName}
                  authorImage={post.authorImage}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </NanoSitePage>
  );
}
