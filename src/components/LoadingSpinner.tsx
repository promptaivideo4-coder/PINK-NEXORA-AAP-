export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';
  return (
    <div
      className={`${dim} rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto`}
      role="status"
      aria-label="Loading"
    />
  );
}
