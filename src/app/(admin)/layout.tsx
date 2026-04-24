import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  // Note: role check is enforced per-query in Convex via requireAdmin()
  return <AdminShell>{children}</AdminShell>;
}
