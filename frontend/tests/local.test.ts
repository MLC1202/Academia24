import assert from 'node:assert/strict';
import { test } from 'node:test';
import { jsonLdUnidades } from '../src/data/local.ts';
import { SEO } from '../src/data/seo.ts';

const site = 'https://exemplo.com.br/';

test('json_ld_tem_as_4_unidades_e_sobrevive_ao_JSON', () => {
  const ld = JSON.parse(JSON.stringify(jsonLdUnidades(site)));
  assert.equal(ld['@graph'].length, 4);
  assert.equal(ld['@graph'][0].address.addressLocality, 'Barueri');
  assert.equal(ld['@graph'][0].openingHoursSpecification.length, 3);
});

test('json_ld_sem_dado_nao_inventa_campo', () => {
  const lagoa = jsonLdUnidades(site)['@graph'][3];
  assert.equal(lagoa.address.addressNeighborhood, 'Lagoa');
  assert.equal('telephone' in lagoa, false);
  assert.equal('geo' in lagoa, false);
});

test('descricao_da_home_cabe_no_google_e_cita_barueri', () => {
  assert.ok(SEO.inicio.descricao.length <= 160, String(SEO.inicio.descricao.length));
  assert.match(SEO.inicio.descricao, /Barueri/);
});
