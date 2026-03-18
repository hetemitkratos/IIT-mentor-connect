import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Not logged in → go to custom sign-in page
  if (!session) {
    redirect("/signin");
  }

  // Logged in → go to dashboard
  redirect("/dashboard");
}
