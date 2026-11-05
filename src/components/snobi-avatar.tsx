// A customer's Snobi: the option they picked with any items they wear layered on top. Every layer
// shares one square canvas, so they line up.
export function SnobiAvatar({
  imageUrl,
  wornUrls = [],
  alt,
  className = "",
}: {
  imageUrl: string;
  wornUrls?: string[];
  alt: string;
  className?: string;
}) {
  return (
    <span className={`snobi-avatar ${className}`} role="img" aria-label={alt}>
      <img src={imageUrl} alt="" loading="lazy" />
      {wornUrls.map((url) => (
        <img key={url} src={url} alt="" loading="lazy" />
      ))}
    </span>
  );
}
