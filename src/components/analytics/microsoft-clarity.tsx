const CLARITY_PROJECT_ID_PATTERN = /^[a-z0-9]+$/i;

export function MicrosoftClarity({ projectId }: { projectId: string }) {
  const id = projectId.trim();
  if (!CLARITY_PROJECT_ID_PATTERN.test(id)) return null;

  return (
    <script
      id="microsoft-clarity"
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(id)});`,
      }}
    />
  );
}
