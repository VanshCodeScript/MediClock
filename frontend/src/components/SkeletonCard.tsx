const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <div className={`glass-card p-5 animate-pulse ${className}`}>
    <div className="h-10 w-10 bg-muted rounded-xl mb-3" />
    <div className="h-3 w-20 bg-muted rounded mb-2" />
    <div className="h-6 w-16 bg-muted rounded" />
  </div>
);

export default SkeletonCard;
