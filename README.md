# SoapCalc · The Hidden Grimoire

[SoapCalc](https://soapcalc.dacruz.ca) is a workspace for soap formulation, herbal preparations, recipes, and ingredient inventory. It carries forward Brenda’s Grimoire design and uses Brenda’s verified workflows as the migration baseline.

## Project overview

| Area | Purpose |
| --- | --- |
| [Master Items](https://soapcalc.dacruz.ca/master-items.html) | Shared ingredient catalog with searchable metadata, formulation values, and catalog administration. |
| [Inventory](https://soapcalc.dacruz.ca/stores.html) | Personal stock, supplier and manufacturer details, purchase pricing, markup, and retail estimates. Items are added from Master Items. |
| Planned workspaces | Soap Calc, Herbal Preparations, Prepared Oils, Soap Recipes, Topical Preparations, and Soaks. |

Every Inventory record references an existing Master Item. Personal Inventory starts fresh in SoapCalc. Each account manages its own stock and costs. The eventual recipe costing workflow will use those personal costs and identify missing prices.

## Architecture

GitHub holds the website and versioned SQL migrations. Cloudflare Pages deploys the site from `main`. Supabase provides sign-in and PostgreSQL. Row-level security scopes Inventory to its owner and catalog edits to designated admins.

- `index.html` — Grimoire overview
- `master-items.html` — Shared catalog and Inventory handoff
- `stores.html` — Personal Inventory
- `static/` — Grimoire styles, fonts, and artwork
- `supabase/migrations/` — Database schema changes

## Migration status

The overview, Master Items, and Inventory are deployed. The catalog was seeded from Brenda. Current QA covers signed-in Add and Edit, the Inventory handoff, stock and price saves, retire and restore, responsive layout, and account isolation. Full browser verification and remaining Brenda workflow parity are in progress.

Once Master Items and Inventory are verified, the next workspace will be chosen between Soap Calc and Herbal Preparations. Metadata refresh, supplier sync, and GPT workflows are pending. Calculator migration will preserve approved formulas and ingredient values, with independent comparison against Brenda before release.
