
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-toss-gray-200 dark:bg-toss-gray-700", className)}
      {...props}
    />
  )
}

export { Skeleton }