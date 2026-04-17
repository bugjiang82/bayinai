import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import { AuthProvider } from "@/providers/AuthProvider";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  if (!session?.user) {
    redirect("/login");
  }

  let credits = 0;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    if (user) credits = user.credits;
  } catch {
    // silently ignore
  }

  return (
    <AuthProvider session={session}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
          credits={credits}
        />
        <div className="flex-1 flex pt-16">
          <Sidebar />
          <main className="flex-1" style={{ marginLeft: 'var(--sidebar-width, 56px)' }}>
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </main>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}
