import { jsonError } from '@/lib/wheel/server';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/wheel/history — DESATIVADO (Roleta V2).
 * O histórico de giros é registro comercial e não pode ser apagado pela interface.
 * A rota responde 410 e não executa nenhuma exclusão.
 */
export async function DELETE() {
  return jsonError(410, 'A exclusão do histórico de giros foi desativada. Nenhum registro foi apagado.');
}
