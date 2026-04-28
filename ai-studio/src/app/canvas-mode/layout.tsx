import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CanvasModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] overflow-hidden">
      {children}
    </div>
  );
}
