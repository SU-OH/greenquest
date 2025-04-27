export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-600"></div>
        </div>
        <h2 className="text-xl font-semibold text-green-800">Loading GreenQuest...</h2>
        <p className="text-green-600">Making the world greener one action at a time</p>
      </div>
    </div>
  )
}
