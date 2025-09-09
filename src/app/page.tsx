import DbStatus from "@/components/DbStatus";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">🚀 Meu Projeto</h1>
      <DbStatus />
    </main>
  );
}
