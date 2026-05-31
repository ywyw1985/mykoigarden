# My Koi Garden

My Koi Garden is a static koi knowledge website for:

- Koi care basics
- Koi health, disease prevention, and treatment supply guides
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
- `/koi-health/`
- `/koi-health/prevention.html`
- `/koi-health/symptoms.html`
- `/koi-health/treatment-supplies.html`
- `/koi-varieties/`
- `/koi-varieties/tancho.html`
- `/koi-varieties/utsurimono.html`
- `/koi-varieties/bekko.html`
- `/koi-varieties/asagi.html`
- `/koi-varieties/non-gosanke.html`
- `/choose-koi/`
- `/pond-guide/`
- `/pond-guide/pond-types.html`
- `/pond-guide/filtration-systems.html`
- `/pond-guide/construction-materials.html`
- `/pond-guide/aquatic-plants.html`
- `/journal/`
- `/zh/`
- `/sources.html`
- `/affiliate-disclosure.html`

## Editorial Sources

Professional reference sources include the All Japan Nishikigoi Promotion Association, Zen Nippon Airinkai, Kyorin Hikari, and Japanese koi farm variety guides. Images are either project-generated or licensed/credited assets.
