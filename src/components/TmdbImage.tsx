import Image from "next/image";

type TmdbImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
};

export default function TmdbImage({
  src,
  alt,
  className,
  width = 500,
  height = 750,
  sizes,
  priority = false,
  loading,
}: TmdbImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={loading}
      unoptimized
      className={className}
    />
  );
}
