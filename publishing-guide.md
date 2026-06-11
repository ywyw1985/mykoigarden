# Publishing My Koi Garden

This site is a static website. The files to publish are:

- `index.html`
- `styles.css`
- `assets/koi-garden-hero.png`

## Easiest First Publish

Use Netlify Drop or Cloudflare Pages direct upload if you want the least technical first step:

1. Create a free account with the host.
2. Upload the contents of this `outputs` folder.
3. Confirm the temporary host URL works.
4. Add `mykoigarden.com` as a custom domain in the host dashboard.
5. Update DNS wherever you registered the domain.

## DNS Shape

Most hosts ask for one or both of these:

- `www.mykoigarden.com` as a `CNAME` pointing to the host's provided site address.
- `mykoigarden.com` as an apex/root record using the host's recommended `A`, `ALIAS`, `ANAME`, or flattening option.

Use the exact target values shown in your hosting dashboard. DNS can take minutes to hours to fully update.

## Good Next Step

After the first publish works, move the files into a GitHub repository. Then connect the repository to Netlify, Cloudflare Pages, or GitHub Pages so future edits can be published by pushing changes.

## Official Docs Checked

- Netlify custom domains and DNS: https://docs.netlify.com/domains/configure-domains/configure-external-dns/
- Cloudflare Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- GitHub Pages custom domains: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site
