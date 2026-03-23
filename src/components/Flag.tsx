const Flag = ({ src, alt, size = "md" }: { src: string; alt: string; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = { sm: "h-5 w-7", md: "h-6 w-8", lg: "h-8 w-11" };
  if (!src) return <div className={`${sizeClasses[size]} rounded bg-secondary`} />;
  return <img src={src} alt={alt} className={`${sizeClasses[size]} rounded object-cover`} />;
};

export default Flag;
