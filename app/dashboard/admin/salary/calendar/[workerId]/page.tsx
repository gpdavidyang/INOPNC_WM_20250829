import WorkerCalendarClient from './worker-calendar-client'

interface PageProps {
  params: {
    workerId: string
  }
  searchParams: {
    name?: string
    year?: string
    month?: string
  }
}

export default function WorkerCalendarPage({ params, searchParams }: PageProps) {
  const workerId = params.workerId
  const workerName = searchParams.name || 'Unknown Worker'
  const year = parseInt(searchParams.year || new Date().getFullYear().toString())
  const month = parseInt(searchParams.month || (new Date().getMonth() + 1).toString())

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">로딩 중...</span>
      </div>
    }>
      <WorkerCalendarClient 
        workerId={workerId}
        workerName={workerName}
        year={year}
        month={month}
      />
    </Suspense>
  )
}