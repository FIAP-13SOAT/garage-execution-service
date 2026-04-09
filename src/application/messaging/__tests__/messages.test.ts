import { describe, it, expect } from 'vitest';
import {
  ExecutionCommand,
  ExecutionReply,
  ExecutionEvent,
  StockCommand,
  StockReply,
} from '../messages.js';

describe('messages', () => {
  it('ExecutionCommand has ENFILEIRAR_OS and CANCELAR_EXECUCAO', () => {
    expect(ExecutionCommand.ENFILEIRAR_OS).toBe('ENFILEIRAR_OS');
    expect(ExecutionCommand.CANCELAR_EXECUCAO).toBe('CANCELAR_EXECUCAO');
  });

  it('ExecutionReply has OS_ENFILEIRADA and EXECUCAO_FALHA', () => {
    expect(ExecutionReply.OS_ENFILEIRADA).toBe('OS_ENFILEIRADA');
    expect(ExecutionReply.EXECUCAO_FALHA).toBe('EXECUCAO_FALHA');
  });

  it('ExecutionEvent has STATUS_ATUALIZADO and EXECUCAO_CONCLUIDA', () => {
    expect(ExecutionEvent.STATUS_ATUALIZADO).toBe('STATUS_ATUALIZADO');
    expect(ExecutionEvent.EXECUCAO_CONCLUIDA).toBe('EXECUCAO_CONCLUIDA');
  });

  it('StockCommand has RESERVAR_ESTOQUE and RESTAURAR_ESTOQUE', () => {
    expect(StockCommand.RESERVAR_ESTOQUE).toBe('RESERVAR_ESTOQUE');
    expect(StockCommand.RESTAURAR_ESTOQUE).toBe('RESTAURAR_ESTOQUE');
  });

  it('StockReply has ESTOQUE_RESERVADO, ESTOQUE_INSUFICIENTE and ESTOQUE_RESTAURADO', () => {
    expect(StockReply.ESTOQUE_RESERVADO).toBe('ESTOQUE_RESERVADO');
    expect(StockReply.ESTOQUE_INSUFICIENTE).toBe('ESTOQUE_INSUFICIENTE');
    expect(StockReply.ESTOQUE_RESTAURADO).toBe('ESTOQUE_RESTAURADO');
  });
});
