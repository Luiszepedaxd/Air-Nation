-- Poster del video del post (thumbnail generado por Cloudflare Stream).
-- Se usa como `poster` del <video> para que el feed muestre el primer frame
-- sin tener que descargar el manifiesto HLS.
alter table public.player_posts
  add column if not exists thumbnail_url text;
