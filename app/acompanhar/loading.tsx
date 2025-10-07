import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AcompanharLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF4A97' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Fixed background image */}
      <div className="fixed inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-96 h-96 bg-gray-200 rounded-full animate-pulse" />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Skeleton className="h-10 w-20" />
              <div className="flex-1">
                <Skeleton className="h-10 w-80 mx-auto mb-2" />
                <Skeleton className="h-5 w-96 mx-auto" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          {/* Search Section */}
          <Card className="mb-8 border-2 border-purple-100 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex items-end">
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading Cards */}
          <div className="space-y-6">
            <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-px w-full my-4" />
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <Skeleton className="h-4 w-80 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
