import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#9854CB] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
