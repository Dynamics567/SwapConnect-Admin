// app/unauthorized/page.tsx or pages/unauthorized.tsx
export default function UnauthorizedPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-3">
          403 - Access Denied
        </h1>
        <p className="text-gray-600">
          You do not have permission to view this page.
        </p>
      </div>
    </div>
  );
}
