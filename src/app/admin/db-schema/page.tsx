
"use client";

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, ArrowLeft, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ClientOnly from '@/components/client-only';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';

interface Column {
    column_name: string;
    data_type: string;
    is_nullable: 'YES' | 'NO';
}

interface SchemaData {
    stores: Column[];
    sellers: Column[];
    goals: Column[];
}

function SchemaViewer() {
    const [schema, setSchema] = useState<SchemaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSchema() {
            try {
                const res = await fetch('/api/db-schema');
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.details || 'Falha ao buscar o schema.');
                }
                const data = await res.json();
                setSchema(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.');
            } finally {
                setLoading(false);
            }
        }
        fetchSchema();
    }, []);

    const renderTable = (tableName: string, columns: Column[] | undefined) => (
        <Card className="flex-1 min-w-[280px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold"><Database size={20}/> {tableName}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/3">Coluna</TableHead>
                            <TableHead className="w-1/3 hidden sm:table-cell">Tipo</TableHead>
                            <TableHead className="w-1/3 text-right">Nulo?</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {columns && columns.length > 0 ? (
                            columns.map((col) => (
                                <TableRow key={col.column_name}>
                                    <TableCell className="font-mono font-medium text-sm">{col.column_name}</TableCell>
                                    <TableCell className="font-mono text-sm hidden sm:table-cell">{col.data_type}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={col.is_nullable === 'YES' ? 'secondary' : 'destructive'}>
                                            {col.is_nullable}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    Nenhuma coluna encontrada ou a tabela não existe.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Consultando estrutura do banco de dados...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Erro ao Carregar Schema</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive/90">{error}</p>
                    <p className="text-muted-foreground mt-2">
                        Verifique a conexão com o banco de dados e se as tabelas foram criadas corretamente.
                        Você pode tentar executar a configuração inicial novamente.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                     <h1 className="text-3xl font-bold">Schema do Banco de Dados</h1>
                     <p className="text-muted-foreground">Estrutura atual das tabelas no Neon.</p>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Painel Admin
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {renderTable('stores', schema?.stores)}
                {renderTable('sellers', schema?.sellers)}
                {renderTable('goals', schema?.goals)}
            </div>
        </div>
    );
}


export default function DbSchemaPage() {
    return (
        <ClientOnly>
            <AppLayout>
              <SchemaViewer />
            </AppLayout>
        </ClientOnly>
    );
}
