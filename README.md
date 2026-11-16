# SoapCalc · The Hidden Grimoire

[SoapCalc](https://soapcalc.dacruz.ca) is a workspace for soap formulation, herbal preparations, recipes, and ingredient inventory. It carries forward Brenda’s Grimoire design and uses Brenda’s verified workflows as the migration baseline.

## Project overview

| Area | Purpose |
| --- | --- |
| [Apothecary Catalog](https://soapcalc.dacruz.ca/apothecary-catalog) | Shared ingredient catalog with searchable metadata, formulation values, and catalog administration. |
| [My Apothecary](https://soapcalc.dacruz.ca/my-apothecary) | Personal stock, supplier and manufacturer details, purchase pricing, markup, and retail estimates. Items are added from Apothecary Catalog. |
| Planned workspaces | Soap Calc, Herbal Preparations, Prepared Oils, Soap Recipes, Topical Preparations, and Soaks. |

Every Inventory record references an existing Master Item. Personal Inventory starts fresh in SoapCalc. Each account manages its own stock and costs. The eventual recipe costing workflow will use those personal costs and identify missing prices.

## Architecture

GitHub holds the website and versioned SQL migrations. Cloudflare Pages deploys the site from `main`. Supabase provides sign-in and PostgreSQL. Row-level security scopes Inventory to its owner and catalog edits to designated admins.

- `index.html` — The Grimoire homepage
- `apothecary-catalog.html` — Shared catalog and Inventory handoff
- `my-apothecary.html` — My Apothecary (personal inventory)
- `static/` — Grimoire styles, fonts, and artwork
- `supabase/migrations/` — Database schema changes

## Migration status

The overview, Apothecary Catalog, and Inventory are deployed. The catalog was seeded from Brenda. Current QA covers signed-in Add and Edit, the Inventory handoff, stock and price saves, retire and restore, responsive layout, and account isolation. Full browser verification and remaining Brenda workflow parity are in progress.

Once Apothecary Catalog and Inventory are verified, the next workspace will be chosen between Soap Calc and Herbal Preparations. Ask the Grimoire is deployed. Admin catalog tools include AI metadata and supplier previews with explicit application of selected changes. Calculator migration will preserve approved formulas and ingredient values, with independent comparison against Brenda before release.

## Interface conventions

Add a short hover hint to each new action button. Describe what the action does and keep the button’s visible label meaningful by itself.

Workspace pages use the existing `workspace-frame` and `workspace-main` layout. Mount the shared sidebar with `data-grimoire-sidebar` and the mobile menu with `data-grimoire-nav`, passing the page route to each. Load `static/js/grimoire-nav.js` and `static/css/grimoire-account.css` for the shared markup, links, and styles. Profile uses the same navigation links in its account layout.

## Data naming and recipe roadmap

| Page | Database table |
| --- | --- |
| Apothecary Catalog | `master_items` |
| My Apothecary | `inventory_items` |

- [ ] Add a Shared Recipes section. Each recipe has exactly two visibility options, **Private** (owner only, default) or **Shared with everyone**. Sharing grants read access. Editing stays with the owner. There is no per-person or group sharing. Enforce visibility in database policies and keep personal inventory and costs private.
