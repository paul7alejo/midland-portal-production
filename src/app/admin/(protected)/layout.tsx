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
    redirect("/admin/login?reason=unauthorized");
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Amber banner */}
      <div className="bg-amber text-white font-medium py-2 px-4 text-sm leading-6 sm:text-base lg:ml-64">
        Admin View — Staff Only | Midland Sleep
      </div>

      {/* Main content */}
      <main className="min-h-screen lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
