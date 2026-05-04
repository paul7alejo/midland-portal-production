import { redirect } from "next/navigation";
import { getAdminUser, isAuthorizedAdmin } from "@/lib/security";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user || !isAuthorizedAdmin(user)) {
    redirect("/login?reason=unauthorized");
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar />

      {/* Amber banner */}
      <div className="ml-64 bg-amber text-white font-medium py-2 px-4 text-base">
        Admin View — Staff Only | Midland Sleep
      </div>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
