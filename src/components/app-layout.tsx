
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-muted/30">
            <Sidebar />
            <main className="flex-1 md:p-8 sm:p-6 p-4">
                {children}
            </main>
        </div>
    );
}
