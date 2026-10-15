import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  lerConsentimento,
  gravarConsentimento,
  nomesCookiesGa,
  esquecerEscolhaDaVisita,
} from "../src/lib/consentimento.ts";

const comValor = (valor: string | null) => () => ({ getItem: () => valor });
const quebrado = () => {
  throw new Error("SecurityError: storage bloqueado");
};

beforeEach(() => esquecerEscolhaDaVisita());

test("le_escolha_valida", () => {
  const salvo = JSON.stringify({ escolha: "aceito", versao: "2026-10-14" });
  assert.equal(lerConsentimento(comValor(salvo)), "aceito");
});

test("versao_antiga_vira_null", () => {
  const salvo = JSON.stringify({ escolha: "aceito", versao: "2026-10-07" });
  assert.equal(lerConsentimento(comValor(salvo)), null);
});

test("json_corrompido_vira_null", () => {
  assert.equal(lerConsentimento(comValor("{xx")), null);
});

test("escolha_desconhecida_vira_null", () => {
  const salvo = JSON.stringify({ escolha: "talvez", versao: "2026-10-14" });
  assert.equal(lerConsentimento(comValor(salvo)), null);
});

test("storage_que_lanca_usa_memoria", () => {
  assert.equal(gravarConsentimento("recusado", quebrado), false);
  assert.equal(lerConsentimento(quebrado), "recusado");
});

test("sem_storage_e_sem_memoria_e_null", () => {
  assert.equal(lerConsentimento(quebrado), null);
});

test("grava_json_com_versao", () => {
  const gravados: [string, string][] = [];
  const ok = gravarConsentimento("aceito", () => ({
    setItem: (chave: string, valor: string) => {
      gravados.push([chave, valor]);
    },
  }));
  assert.equal(ok, true);
  assert.deepEqual(gravados, [
    ["consentimento-cookies", JSON.stringify({ escolha: "aceito", versao: "2026-10-14" })],
  ]);
});

test("sem_cookies_lista_vazia", () => {
  assert.deepEqual(nomesCookiesGa(""), []);
});

test("filtra_cookies_ga", () => {
  assert.deepEqual(nomesCookiesGa("_ga=1; outro=2; _ga_ABC123=3; _gat=4"), ["_ga", "_ga_ABC123"]);
});
