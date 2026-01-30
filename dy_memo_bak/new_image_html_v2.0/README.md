# INOPNC · Next.js (App Router) + Tailwind (Converted)

This project was generated from your uploaded `base.html` and `main.html` to match the original UI as closely as possible.

## Routes

- `/` → converted from **base.html** (홈)
- `/main` → converted from **main.html** (메인)

## How to run

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Notes

- All inline `<style>` rules from both HTML files are merged into `app/globals.css` for pixel-perfect fidelity.
- Google Fonts and Lucide are loaded exactly as in the originals to maintain identical rendering.
- The original body HTML is rendered inside each page with `dangerouslySetInnerHTML` to ensure 100% layout fidelity without re-implementing every rule in JSX.
- If the original pages relied on inline scripts, those are bundled in `app/components/LegacyInlineScripts.tsx` (auto-injected on mount). If you need page-specific script behavior later, split and scope them per route.
