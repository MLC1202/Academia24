// Endereco do site em producao. E o UNICO lugar onde o dominio aparece:
// sitemap.xml, robots.txt, a imagem de previa de link (Open Graph) e o
// redirecionamento dos outros dominios usam daqui (plugin "seo" do
// vite.config.ts).
//
// Decidido com a dona/Matheus em 01/10/2026: UM site so (as 4 unidades e os
// dois logos), dominio principal academia24hclub.com, com www.
// Vazio = o "npm run build" para com erro, de proposito.
// (A previa do GitHub Pages nao usa isto e fica fora do Google.)
export const SITE_URL = 'https://www.academia24hclub.com';

// Outros dominios da rede que devem cair no site acima (redirecionamento
// 301, mantendo o caminho: 24wellness.com.br/agendamento ->
// www.academia24hclub.com/agendamento). Vale com e sem "www".
// O principal sem/com "www" (o contrario do SITE_URL) tambem redireciona.
// Subdominios (ex.: alphaville.24wellness.com.br, das LPs) NAO sao afetados.
export const DOMINIOS_QUE_REDIRECIONAM = ['24wellness.com.br'];

// Arquivo da politica de privacidade, em public/. Basta colocar o PDF com
// este nome la: o rodape e o formulario de agendamento ja apontam pra ele.
// (So o nome: quem usa junta com o import.meta.env.BASE_URL, porque este
// arquivo tambem e lido pelo vite.config.ts, onde o BASE_URL nao existe.)
export const POLITICA_PRIVACIDADE = 'politica-de-privacidade.pdf';
