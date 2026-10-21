import { test } from "node:test";
import assert from "node:assert/strict";
import { deveAtivarAnalytics, type CondicoesGa } from "../src/lib/analytics-regras.ts";

const base: CondicoesGa = {
  gaId: "G-TESTE12345",
  producao: true,
  debug: false,
  hostname: "www.24wellness.com.br",
  hostSite: "www.24wellness.com.br",
  caminho: "/",
  escolha: "aceito",
};

test("ativa_com_tudo_valido", () => {
  assert.equal(deveAtivarAnalytics(base), true);
});

test("sem_id_nao_ativa", () => {
  assert.equal(deveAtivarAnalytics({ ...base, gaId: "" }), false);
});

test("dev_nao_ativa", () => {
  assert.equal(deveAtivarAnalytics({ ...base, producao: false }), false);
});

test("outro_host_nao_ativa", () => {
  assert.equal(deveAtivarAnalytics({ ...base, hostname: "mlc1202.github.io" }), false);
});

test("debug_ignora_host", () => {
  assert.equal(deveAtivarAnalytics({ ...base, hostname: "localhost", debug: true }), true);
});

test("debug_nao_ignora_consentimento", () => {
  assert.equal(deveAtivarAnalytics({ ...base, debug: true, escolha: null }), false);
});

test("recusado_nao_ativa", () => {
  assert.equal(deveAtivarAnalytics({ ...base, escolha: "recusado" }), false);
});

test("sem_escolha_nao_ativa", () => {
  assert.equal(deveAtivarAnalytics({ ...base, escolha: null }), false);
});

test("admin_nao_ativa", () => {
  assert.equal(deveAtivarAnalytics({ ...base, caminho: "/admin/dashboard" }), false);
  assert.equal(deveAtivarAnalytics({ ...base, caminho: "/admin" }), false);
});

test("admininho_nao_e_admin", () => {
  assert.equal(deveAtivarAnalytics({ ...base, caminho: "/administracao" }), true);
});
