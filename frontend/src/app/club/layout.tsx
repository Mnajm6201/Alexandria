// app/club/layout.tsx
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header variant="app" />
      <main className="container max-w-7xl mx-auto px-4 py-8 md:px-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
