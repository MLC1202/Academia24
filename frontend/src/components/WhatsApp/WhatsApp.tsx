// Botao flutuante do WhatsApp: fica preso no canto de baixo da tela e desce
// junto enquanto a pessoa rola a home. Por enquanto e so o lugar do chatbot.
//
// PRA LIGAR:
// - Numero: coloque em WHATSAPP_NUMERO do jeito que vier ("11 99999-9999",
//   "(11) 99999-9999", "+55 11 ..."). O paraNumeroWa() tira espaco, traco e
//   parenteses e poe o 55 do Brasil se faltar, porque o wa.me so aceita
//   digitos com DDI — com espaco ou sem o 55 o link da 404.
//   Com o numero, o botao abre a conversa ja com a MENSAGEM escrita.
// - Chatbot: se a ferramenta do chatbot pedir pra abrir uma janela em vez
//   do link, e so trocar o que acontece no abrirChat().
// Enquanto o numero estiver vazio, o botao aparece mas nao faz nada.

import "./WhatsApp.css";

const WHATSAPP_NUMERO = "11 99499-2924";
const MENSAGEM = "Olá! Vim pelo site e quero saber mais sobre a Rede 24.";

// "11 99499-2924" -> "5511994992924"
function paraNumeroWa(numero: string) {
  const digitos = numero.replace(/\D/g, "");
  // 10 ou 11 digitos = DDD + numero, falta o DDI do Brasil.
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return digitos;
}

function WhatsApp() {
  const numero = paraNumeroWa(WHATSAPP_NUMERO);
  const link = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(MENSAGEM)}`
    : undefined;

  function abrirChat() {
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      className="whatsapp"
      onClick={abrirChat}
      aria-label="Fale com a gente pelo WhatsApp"
    >
      <span className="whatsapp__balao" aria-hidden="true">
        Fale com a gente
      </span>
      <svg
        className="whatsapp__icone"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path
          d="M16 3.2C8.9 3.2 3.2 8.8 3.2 15.8c0 2.4.7 4.7 1.9 6.6L3.2 28.8l6.6-1.9c1.9 1 4 1.6 6.2 1.6 7.1 0 12.8-5.6 12.8-12.7S23.1 3.2 16 3.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        <path
          d="M12 9.6c-.3-.6-.6-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 3.9 1.7 4.2c.2.3 2.9 4.6 7.1 6.2 3.5 1.4 4.2 1.1 5 1 .8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5l-2.8-1.4c-.4-.2-.7-.2-.9.2-.3.4-1 1.3-1.3 1.5-.2.3-.5.3-.9.1-.4-.2-1.8-.7-3.4-2.1-1.3-1.1-2.1-2.5-2.4-2.9-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7L12 9.6z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

export default WhatsApp;
