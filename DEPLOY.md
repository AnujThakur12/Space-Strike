# Space Strike — Deploy to Netlify

## One-click deploy

1. Go to [netlify.com](https://netlify.com) → **Sites** → drag your folder onto the browser

2. **Before uploading, you can delete these (not needed for Netlify):**
   - `server/` folder — only needed for local development
   - `node_modules/` folders — Netlify installs deps itself

3. That's it. The game is live at `https://YOUR-SITE.netlify.app`

   Accounts work via Netlify Functions + Blob Store.

## Environment Variables (optional)
In Netlify → Site settings → Environment variables:

| Key | Value | Required |
|---|---|---|
| `JWT_SECRET` | any random string (e.g. `openssl rand -hex 32`) | Recommended for security |
| `ADMIN_KEY` | any password | Optional — to view registered users |

## View registered users
`https://YOUR-SITE.netlify.app/api/admin/users` with header `Authorization: Bearer YOUR_ADMIN_KEY`
