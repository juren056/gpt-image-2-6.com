import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FolderOpen } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { apiGet } from '@/lib/api-client';

export function BananaProjectResume({
  copy,
}: {
  copy: Record<string, string>;
}) {
  const { data: session } = useSession();
  const projects = useQuery({
    queryKey: ['creative-projects', session?.user.id],
    queryFn: () =>
      apiGet<Array<{ id: string; title: string; updatedAt: string }>>(
        '/api/studio/projects'
      ),
    enabled: Boolean(session?.user),
  });
  if (!session?.user) return null;
  return (
    <section className="project-resume" aria-label={copy.projects}>
      <div>
        <FolderOpen size={22} aria-hidden />
        <h2>{copy.projects}</h2>
        <Link href="/settings/assets">
          {copy.library}
          <ArrowRight size={16} />
        </Link>
      </div>
      {projects.isPending ? (
        <p role="status">{copy.loading}</p>
      ) : projects.isError ? (
        <button onClick={() => void projects.refetch()}>{copy.retry}</button>
      ) : projects.data?.length ? (
        <ul>
          {projects.data.slice(0, 3).map((project) => (
            <li key={project.id}>
              <Link
                href={`/settings/studio?project=${encodeURIComponent(project.id)}`}
              >
                <strong>{project.title}</strong>
                <span>
                  {copy.continue}
                  <ArrowRight size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>{copy.empty}</p>
      )}
    </section>
  );
}
