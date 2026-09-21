# erickrj.tech

Personal site and blog for Erick and Stella Johnson. A static Jekyll site
with a hand-built Tailwind theme, deployed to GitHub Pages by GitHub
Actions.

<https://erickrj.tech>

## Tech stack

| Layer | Tool | Why |
| --- | --- | --- |
| Site generator | [Jekyll](https://jekyllrb.com) 4.4 | Markdown posts, Liquid templates |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 | Utility classes in HTML; almost no hand-written CSS |
| Bundling | [esbuild](https://esbuild.github.io) | One small ES module bundle, no framework |
| Fonts | [subset-font](https://github.com/papandreou/subset-font) | Subsets the OFL originals to Latin WOFF2 |
| Images | [sharp](https://sharp.pixelplumbing.com) | Responsive AVIF/WebP/JPEG at four widths |
| Search | [Pagefind](https://pagefind.app) | Full-text search with no server or third-party API |
| Icons | [Lucide](https://lucide.dev) + [Simple Icons](https://simpleicons.org) | Generated into one inline SVG sprite |
| Syntax highlighting | [Rouge](https://github.com/rouge-ruby/rouge) | Runs at build time, ships no JavaScript |
| Comments | [Giscus](https://giscus.app) | Backed by GitHub Discussions |
| Newsletter | Mailchimp | Hand-written form, no jQuery |
| Contact form | [Web3Forms](https://web3forms.com) | Form handling without a backend |
| Hosting | GitHub Pages via GitHub Actions | Free, and the Actions build removes the plugin allowlist |

Fonts are Dosis (headings), Quicksand (body), Jura (small text) and
JetBrains Mono (code), all self-hosted under the SIL Open Font License.

## Requirements

- **Ruby 3.3** with the DevKit — on Windows, `winget install RubyInstallerTeam.RubyWithDevKit.3.3`
- **Node 20.11 or newer** (CI uses 22)
- **Bundler** — `gem install bundler`

## Getting started

```bash
bundle install     # Ruby gems
npm install        # Node tooling
npm run build      # fonts, images, CSS, JS
bundle exec jekyll serve
```

The site is then at <http://localhost:4000>.

`npm run build` has to run at least once before the first Jekyll build.
It produces the stylesheet, the JS bundle, the WOFF2 fonts and the
responsive images, none of which are committed.

### Working on the site

Run these in two terminals:

```bash
npm run watch              # rebuilds CSS and JS on change
bundle exec jekyll serve   # rebuilds HTML on change
```

Search is the one thing that does not work in local preview: Pagefind
indexes the built `_site` directory, so it needs a full build.

```bash
npm run site   # assets + jekyll build + search index
```

## Commands

| Command | Does |
| --- | --- |
| `npm run build` | Fonts, images, CSS and JS |
| `npm run build:css` | Tailwind only |
| `npm run build:js` | esbuild only |
| `npm run build:fonts` | Re-subset `dev/fonts/*.ttf` to WOFF2 |
| `npm run build:img` | Regenerate responsive images and `_data/images.json` |
| `npm run build:icons` | Refetch the icon sprite into `_includes/icons.html` |
| `npm run build:search` | Pagefind index over `_site` |
| `npm run watch` | Watch CSS and JS |
| `npm run site` | Everything, in the order CI uses |

`build:icons` reaches out to a CDN and is the only command that needs the
network. The sprite it writes is committed, so CI never runs it.

## Layout

```
_data/           nav.yml, projects.yml, photos.yml, cv.yml
_includes/       head, sidebar, footer, icons sprite, SEO, image helper
_layouts/        one per page type
_posts/          blog posts, YYYY-MM-DD-slug.md
pages/           standalone pages
blog/index.html  post index
dev/css/         Tailwind entry point and the only hand-written CSS
dev/js/          ES modules, bundled to assets/js/app.js
dev/fonts/       original OFL fonts, subset at build time
scripts/         build scripts (fonts, images, icons, js)
assets/          committed originals; generated output is gitignored
```

## Writing a post

Create `_posts/YYYY-MM-DD-slug.md`:

```yaml
---
layout: post
title: "A title"
date: 2026-01-15
categories: Newsletter
tags: [missions, travel]
cover: /assets/img/something.jpg    # optional
author: Stella Johnson             # optional, defaults to site.author
last_modified_at: 2026-02-01       # optional
pin: "true"                        # optional, pins to the top of /archives/
---
```

Drop new images into `assets/img/` and run `npm run build:img`. Reference
them through the helper so they get responsive sources and reserve their
space:

```liquid
{% include image.html src="/assets/img/thing.jpg" alt="What it shows" %}
```

## Adding navigation, projects or photos

Edit `_data/nav.yml`, `_data/projects.yml` or `_data/photos.yml`. Each file
documents its own fields at the top. Sidebar icons come from
`_includes/icons.html`; to add a new one, add its name to `scripts/icons.mjs`
and run `npm run build:icons`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs
both toolchains, builds assets, runs Jekyll, generates the search index,
checks links with html-proofer, and publishes to GitHub Pages.

This replaces the classic GitHub Pages build, which runs Jekyll with a fixed
plugin allowlist and no Node step, and so could not run Tailwind, esbuild,
the image pipeline or Pagefind.

## Licence

Site code is MIT (see `LICENSE`). Post content and photographs are not;
please ask before reusing them. Bundled fonts are under the SIL Open Font
License, with each licence kept alongside its font in `dev/fonts/`.
