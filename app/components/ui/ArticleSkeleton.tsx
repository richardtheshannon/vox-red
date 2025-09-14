export default function ArticleSkeleton() {
  return (
    <div className="h-full flex flex-col justify-center items-center p-6 md:p-12 animate-pulse">
      <div className="max-w-4xl mx-auto text-center space-y-6 w-full">
        <div className="h-12 md:h-16 lg:h-20 bg-gray-300 rounded-md w-3/4 mx-auto"></div>
        <div className="h-6 md:h-8 bg-gray-200 rounded-md w-1/2 mx-auto"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}