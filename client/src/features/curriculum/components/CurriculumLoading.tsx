/**
 * Loading state for curriculum
 */
export function CurriculumLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Loading Your Curriculum
        </h2>
        <p className="text-gray-500">
          Checking access and preparing modules...
        </p>
      </div>
    </div>
  );
}
