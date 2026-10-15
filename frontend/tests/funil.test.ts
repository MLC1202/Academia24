import { test } from "node:test";
import assert from "node:assert/strict";
import { passosConcluidos, NOMES_PASSOS, type EstadoFunil } from "../src/pages/agendamento/funil.ts";

const vazio: EstadoFunil = { quem: "", unidade: "", periodo: "", objetivo: "", completo: false };

test("nada_preenchido", () => {
  assert.deepEqual(passosConcluidos(vazio), []);
});

test("so_quem", () => {
  assert.deepEqual(passosConcluidos({ ...vazio, quem: "eu" }), [0]);
});

test("unidade_pela_url_sem_quem", () => {
  assert.deepEqual(passosConcluidos({ ...vazio, unidade: "norte" }), []);
});

test("unidade_pela_url_com_quem", () => {
  assert.deepEqual(passosConcluidos({ ...vazio, quem: "eu", unidade: "norte" }), [0, 1]);
});

test("pulou_horario", () => {
  const e = { ...vazio, quem: "eu", unidade: "norte", objetivo: "saude" };
  assert.deepEqual(passosConcluidos(e), [0, 1]);
});

test("tudo", () => {
  const e = { quem: "dependente", unidade: "norte", periodo: "manha", objetivo: "saude", completo: true };
  assert.deepEqual(passosConcluidos(e), [0, 1, 2, 3, 4]);
});

test("nomes", () => {
  assert.equal(NOMES_PASSOS[4], "dados");
});
