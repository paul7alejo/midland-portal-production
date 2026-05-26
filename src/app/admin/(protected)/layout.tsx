import { redirect } from "next/navigation";
import { getAdminUser, isAuthorizedAdmin } from "@/lib/security";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user || !isAuthorizedAdmin(user)) {
    redirect("/admin/login?reason=unauthorized");
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
