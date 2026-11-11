import { useSyncExternalStore } from 'react';

const semAssinatura = () => () => {};

// false no pre-render e na hidratacao, true depois. O 1o render do navegador
// tem que sair igual ao HTML do servidor; o que depende de data, hora ou
// localStorage so aparece quando isto vira true.
export function useNoNavegador() {
  return useSyncExternalStore(semAssinatura, () => true, () => false);
}
