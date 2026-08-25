export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted-50 px-4 py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-500">Loading...</p>
      </div>
    </div>
  );
}
