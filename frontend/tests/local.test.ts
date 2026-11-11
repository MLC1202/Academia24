import assert from 'node:assert/strict';
import { test } from 'node:test';
import { jsonLdUnidades, linkMapa, telefoneDe } from '../src/data/local.ts';
import { SEO } from '../src/data/seo.ts';

const site = 'https://exemplo.com.br/';

test('json_ld_tem_as_4_unidades_e_sobrevive_ao_JSON', () => {
  const ld = JSON.parse(JSON.stringify(jsonLdUnidades(site)));
  assert.equal(ld['@graph'].length, 4);
  assert.equal(ld['@graph'][0].address.addressLocality, 'Barueri');
  assert.equal(ld['@graph'][0].openingHoursSpecification.length, 3);
});

test('json_ld_da_lagoa_usa_o_endereco_do_perfil', () => {
  const lagoa = jsonLdUnidades(site)['@graph'][3];
  assert.equal(lagoa.address.addressNeighborhood, 'Jardim Nossa Sra. Auxiliadora');
  assert.equal(lagoa.geo.latitude, -22.8760265);
  assert.equal(jsonLdUnidades(site)['@graph'][2].address.postalCode, '13024-100');
});

test('descricao_da_home_cabe_no_google_e_cita_barueri', () => {
  assert.ok(SEO.inicio.descricao.length <= 160, String(SEO.inicio.descricao.length));
  assert.match(SEO.inicio.descricao, /Barueri/);
});

test('telefone_vira_link_tel_e_link_do_mapa_busca_pelo_nome', () => {
  assert.equal(telefoneDe('alphaville')?.link, 'tel:+5511915371685');
  assert.equal(jsonLdUnidades(site)['@graph'][0].telephone, '+5511915371685');
  assert.equal(telefoneDe('inexistente'), null);
  assert.match(linkMapa('norte'), /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Academia%2024%20Health%20Club/);
});
