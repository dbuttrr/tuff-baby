# TUFF.BABY

A single-screen landing page: white Anton lettering, black background, film grain,
and a fist cursor that grows with pointer speed. Moving the mouse shakes and blurs
the lettering; everything settles when movement stops. Reduced-motion preferences
disable the shake, blur, scaling, and animated grain. Touch devices keep a static wordmark.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

Deploy `dist/` to any static host. There are no backend services, environment variables,
or runtime CDN requests. Anton is bundled locally under the SIL Open Font License
in `public/fonts/OFL.txt`.

## Browser checks

```sh
npm test
```

Tests use `/usr/bin/chromium` in the cloud environment. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`
to another Chromium installation, or run `npx playwright install chromium` on other machines.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys `dist/` whenever
`main` is updated. It can also run manually from the repository's Actions tab.
Official GitHub actions are pinned to commit hashes, and only the deployment job
has Pages write permission.

In the repository's **Settings → Pages**, select **GitHub Actions** as the source
and set the custom domain to `tuff.baby`. The build uses root-relative asset paths
for this custom domain. `public/CNAME` is copied into the build, but the Pages
custom domain must still be configured in the repository settings when deploying
with Actions.

Configure the following DNS records with the domain's DNS provider:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `dbuttrr.github.io` |

Once GitHub's DNS check succeeds and the certificate is provisioned, enable
**Enforce HTTPS**. GitHub Pages redirects the `www` address to the configured
apex domain. Do not add `/tuff-baby/` to the Vite base when using `tuff.baby`.
