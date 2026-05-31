# My Koi Garden

My Koi Garden is a static koi knowledge website for:

- Koi care basics
- Koi variety guides
- Choosing healthy koi
- Pond design and maintenance
- Personal pond journal notes
- Future multilingual content

The site is deployed through Cloudflare Workers Static Assets from this GitHub repository.

## Deployment

Cloudflare settings:

- Build command: `exit 0`
- Deploy command: `npx wrangler deploy --assets . --name mykoigarden --compatibility-date 2026-05-30`

## Content Structure

- `/koi-care/`
- `/koi-varieties/`
- `/koi-varieties/tancho.html`
- `/koi-varieties/utsurimono.html`
- `/koi-varieties/bekko.html`
- `/koi-varieties/asagi.html`
- `/koi-varieties/non-gosanke.html`
- `/choose-koi/`
- `/pond-guide/`
- `/journal/`
- `/zh/`
- `/sources.html`

## Editorial Sources

Professional reference sources include the All Japan Nishikigoi Promotion Association, Zen Nippon Airinkai, Kyorin Hikari, and Japanese koi farm variety guides. Images are either project-generated or licensed/credited assets.
