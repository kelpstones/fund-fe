type CardSkeletonProps = {
  count?: number;
  className?: string;
};

export function CardSkeletonGrid({
  count = 3,
  className = "lg:grid-cols-3",
}: CardSkeletonProps) {
  return (
    <div className={`grid gap-5 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <div className="skeleton h-4 w-24" />
          <div className="mt-3 skeleton h-6 w-3/4" />
          <div className="mt-2 skeleton h-4 w-2/3" />
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="skeleton h-16 rounded-md" />
            <div className="skeleton h-16 rounded-md" />
            <div className="skeleton h-16 rounded-md" />
          </div>
          <div className="mt-5 skeleton h-3 w-full rounded-full" />
          <div className="mt-2 skeleton h-3 w-5/6 rounded-full" />
          <div className="mt-5 flex gap-2">
            <div className="skeleton h-10 flex-1 rounded-md" />
            <div className="skeleton h-10 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: cols }).map((__, colIndex) => (
            <td key={colIndex}>
              <div className="skeleton h-4 w-full max-w-44 rounded-md" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-md border border-base-300 bg-white p-4">
          <div className="skeleton h-5 w-2/3 rounded-md" />
          <div className="mt-3 skeleton h-4 w-full rounded-md" />
          <div className="mt-2 skeleton h-4 w-5/6 rounded-md" />
        </div>
      ))}
    </div>
  );
}
