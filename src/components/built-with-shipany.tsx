export function BuiltWithShipAny({ appUrl }: { appUrl: string }) {
  let hostname = '';
  try {
    hostname = new URL(appUrl).hostname;
  } catch {
    /* A missing URL does not block attribution. */
  }
  const href = `https://shipany.ai/?utm_source=${encodeURIComponent(hostname)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="banana-template-attribution"
    >
      Built with ShipAny <span aria-hidden="true">↗</span>
    </a>
  );
}
