export default function MainLoading() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">加载中...</p>
      </div>
    </div>
  );
}
