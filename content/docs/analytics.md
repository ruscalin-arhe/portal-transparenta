---
title: Analytics si trafic
description: PageView, boti, geo, retentie, Sentry
order: 3
---

# Analytics si trafic

## Colectare

Componenta PageViewTracker trimite POST /api/analytics/view la fiecare navigare.

Se salveaza in PageView: path, IP, tara, oras, referer, userAgent, isAdmin.

## Boti

User-Agent de crawler sau path-uri noise sunt sarite.

## Geo

Pe Vercel: x-vercel-ip-country / city. Local deseori gol.

## Admin

UI: /admin/trafic

## Retentie

- 90 zile (PAGEVIEW_RETENTION_DAYS)
- Script: pnpm exec tsx scripts/purge-pageviews.ts
- Cron: /api/cron/purge-pageviews cu Bearer CRON_SECRET

## Sentry

Erorile pot ajunge in Sentry daca SENTRY_DSN e setat.
