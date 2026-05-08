import PostsFeedPage from "@/components/postFeed";
import { Suspense } from "react";

export default function Page({ params }: { params: Promise<{ username: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <PostsFeedPage params={params} />
    </Suspense>
  );
}