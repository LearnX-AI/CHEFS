import { redirect } from "next/navigation";
import { AdminLoginForm } from "./AdminLoginForm";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  const params = await searchParams;

  if (session) {
    redirect("/admin/dashboard");
  }

  const message =
    params?.error === "invalid"
      ? "Invalid admin username or password."
      : params?.error === "missing"
        ? "Please enter your username and password."
        : "";

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-panel">
        <p className="eyebrow">CHEFS Admin</p>
        <h1>Secure Portal</h1>
        <p>
          Sign in to review student registrations, fee details, and uploaded
          receipts.
        </p>
        <AdminLoginForm initialMessage={message} />
      </section>
    </main>
  );
}
