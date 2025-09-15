
import { Sidebar } from "@/components/sidebar";
import ClientOnly from "./client-only";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClientOnly>
            <div className="flex min-h-screen w-full">
                <Sidebar />
                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>
        </ClientOnly>
    )
}
