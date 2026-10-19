import "./globals.css";
import { MockProvider } from "../context/MockContext";
import { Navbar } from "../components/Navbar";

export const metadata = {
  title: "LifeLink - Blood & Organ Donor Matching System",
  description: "DBMS Mini-Project with Oracle Database",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        <MockProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
              {children}
            </main>
            <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
              Database Management Systems Mini-Project &bull; Oracle Database &amp; PL/SQL Integration
            </footer>
          </div>
        </MockProvider>
      </body>
    </html>
  );
}
