# Originais (fora do site)

Fotos e video como vieram, ANTES de otimizar (01/10/2026). Esta pasta NAO
vai pro site (o Vite so publica o que esta em `public/`).

No site ficam as versoes leves:
- fotos: `public/imagens/**/*.webp` (WebP qualidade 75, lado maior 1600 px)
  -> 3,5 MB viraram 1,7 MB;
- video: `public/videos/hero.mp4` (1280 px, sem trilha de audio, H.264)
  -> 4,7 MB viraram 3,1 MB.

`imagens/bioimpedancia.jpg` era copia identica de `imagens/rede/bioimpedancia.jpg`:
o site agora usa so a da pasta `rede/`.

Pra trocar uma foto do site: abrir a nova no squoosh.app, formato WebP,
qualidade 75, lado maior 1600 px, e salvar com o MESMO nome em `public/imagens/`.
