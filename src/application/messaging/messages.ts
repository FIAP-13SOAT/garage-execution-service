import type { UUID } from '../../shared/types/UUID.js';

// ── Commands received from execution.commands (sent by OS Service) ───────────

export const ExecutionCommand = {
  ENFILEIRAR_OS: 'ENFILEIRAR_OS',
  CANCELAR_EXECUCAO: 'CANCELAR_EXECUCAO',
} as const;
export type ExecutionCommand = (typeof ExecutionCommand)[keyof typeof ExecutionCommand];

// ── Replies sent to execution.replies (consumed by OS Service) ───────────────

export const ExecutionReply = {
  OS_ENFILEIRADA: 'OS_ENFILEIRADA',
  EXECUCAO_FALHA: 'EXECUCAO_FALHA',
} as const;
export type ExecutionReply = (typeof ExecutionReply)[keyof typeof ExecutionReply];

// ── Events sent to execution.events (consumed by OS Service) ─────────────────

export const ExecutionEvent = {
  STATUS_ATUALIZADO: 'STATUS_ATUALIZADO',
  EXECUCAO_CONCLUIDA: 'EXECUCAO_CONCLUIDA',
} as const;
export type ExecutionEvent = (typeof ExecutionEvent)[keyof typeof ExecutionEvent];

// ── Commands sent to stock.commands (consumed by Stock Service) ──────────────

export const StockCommand = {
  RESERVAR_ESTOQUE: 'RESERVAR_ESTOQUE',
  RESTAURAR_ESTOQUE: 'RESTAURAR_ESTOQUE',
} as const;
export type StockCommand = (typeof StockCommand)[keyof typeof StockCommand];

// ── Replies received from stock.replies (sent by Stock Service) ──────────────

export const StockReply = {
  ESTOQUE_RESERVADO: 'ESTOQUE_RESERVADO',
  ESTOQUE_INSUFICIENTE: 'ESTOQUE_INSUFICIENTE',
  ESTOQUE_RESTAURADO: 'ESTOQUE_RESTAURADO',
} as const;
export type StockReply = (typeof StockReply)[keyof typeof StockReply];

// ── Message envelope ─────────────────────────────────────────────────────────

export interface SagaMessage<T = unknown> {
  type: string;
  payload: T;
}

// ── Incoming payloads (execution.commands) ───────────────────────────────────

export interface EnfileirarOsPayload {
  serviceOrderId: UUID;
  stockItems: Array<{ stockItemId: UUID; quantity: number }>;
}

export interface CancelarExecucaoPayload {
  serviceOrderId: UUID;
}

// ── Outgoing payloads (execution.replies) ────────────────────────────────────

export interface OsEnfileiraPayload {
  serviceOrderId: UUID;
}

export interface ExecucaoFalhaPayload {
  serviceOrderId: UUID;
  reason: string;
}

// ── Outgoing payloads (execution.events) ─────────────────────────────────────

export interface StatusAtualizadoPayload {
  serviceOrderId: UUID;
  status: string;
}

export interface ExecucaoConcluidaPayload {
  serviceOrderId: UUID;
}

// ── Outgoing payloads (stock.commands) ───────────────────────────────────────

export interface ReservarEstoquePayload {
  serviceOrderId: UUID;
  items: Array<{ stockId: UUID; quantity: number }>;
}

export interface RestaurarEstoquePayload {
  serviceOrderId: UUID;
  items: Array<{ stockId: UUID; quantity: number }>;
}

// ── Incoming payloads (stock.replies) ────────────────────────────────────────

export interface EstoqueReservadoPayload {
  serviceOrderId: UUID;
}

export interface EstoqueInsuficientePayload {
  serviceOrderId: UUID;
  reason: string;
}

export interface EstoqueRestauradoPayload {
  serviceOrderId: UUID;
}
