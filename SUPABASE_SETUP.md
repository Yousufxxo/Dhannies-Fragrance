# 🗄️ Supabase Setup Guide — Dhannie's Fragrance

## What Supabase gives you
| Feature | What it does |
|---------|-------------|
| **Database (PostgreSQL)** | Stores all product data (name, price, stock, notes, etc.) |
| **Storage Bucket** | Stores uploaded product images as files (not base64) |
| **Free tier** | 500 MB database + 1 GB storage — more than enough |

---

## Step 1 — Create a Supabase Account

1. Go to **https://supabase.com** → click **Start for Free**
2. Sign up with GitHub or email
3. Click **New Project**
   - Name: `dhannies-fragrance`
   - Password: (save this securely)
   - Region: pick closest to Nigeria (e.g. `eu-west-1`)
4. Wait ~1 minute for the project to boot

---

## Step 2 — Create the Products Table

In your Supabase dashboard go to **SQL Editor** → **New Query** → paste and run:

```sql
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  price               INTEGER NOT NULL DEFAULT 0,
  stock               INTEGER NOT NULL DEFAULT 0,
  gender              TEXT CHECK(gender IN ('men','women','unisex')) DEFAULT 'unisex',
  scent               TEXT CHECK(scent IN ('floral','woody','fresh','oriental')) DEFAULT 'floral',
  vibe                TEXT DEFAULT '',
  sizes               TEXT[] DEFAULT ARRAY['30ml','50ml','100ml'],
  sold                BOOLEAN DEFAULT FALSE,
  eco                 BOOLEAN DEFAULT FALSE,
  bestseller          BOOLEAN DEFAULT FALSE,
  top_notes           TEXT[] DEFAULT '{}',
  heart_notes         TEXT[] DEFAULT '{}',
  base_notes          TEXT[] DEFAULT '{}',
  image_url           TEXT DEFAULT '',
  image_storage_path  TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read (storefront)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read products"
  ON products FOR SELECT USING (true);

CREATE POLICY "Anyone can insert products"
  ON products FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update products"
  ON products FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete products"
  ON products FOR DELETE USING (true);
```

> ⚠️ The permissive policies above are fine for a demo.
> When you go to production, restrict INSERT/UPDATE/DELETE to authenticated admin users.

---

## Step 3 — Create the Storage Bucket

1. In Supabase dashboard → **Storage** → **New Bucket**
2. Name: **`product-images`** (must match exactly)
3. Toggle **Public bucket** → ON
4. Click **Create bucket**

Then go to **Storage → Policies** → **New Policy** for `product-images`:

```sql
-- Allow anyone to upload (simplest for demo)
CREATE POLICY "Public upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

-- Allow public read
CREATE POLICY "Public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow delete
CREATE POLICY "Public delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');
```

Or just toggle **Allow all operations** in the UI for `product-images` (fine for demo).

---

## Step 4 — Get Your API Keys

In Supabase dashboard → **Settings** → **API**

Copy:
- **Project URL** — looks like `https://xxxxxxxxxxx.supabase.co`
- **Project API Keys → anon (public)** — starts with `eyJ...`

---

## Step 5 — Connect in the Admin Panel

1. Open your site → go to **Admin** page
2. In the **Database Setup** box:
   - Paste your **Project URL**
   - Paste your **Anon Key**
   - Click **Connect Database**
3. You'll see the status pill turn **green** → "DB Connected"
4. Sign in with: `dhannie` / `dhannie123`

---

## How It Works After Setup

```
Admin uploads image
       ↓
Image → Supabase Storage bucket "product-images"
       ↓
Returns public URL (https://xxx.supabase.co/storage/v1/object/public/product-images/...)
       ↓
URL saved in products table column "image_url"
       ↓
Storefront fetches products from DB → loads images from public URL
```

---

## Before Supabase is Connected (Offline Mode)

The site works **100% without Supabase** using localStorage:
- Products stored in `localStorage.dhannies_products`
- Images stored as base64 strings in localStorage
- All features work — just not shared across devices

Once you connect Supabase, the admin can click **Refresh** to pull from the database.

---

## File Structure

```
dhannies-fragrance/
├── index.html      ← Has <script src="supabase-js"> + all HTML
├── script.js       ← All logic, Supabase integration, product CRUD
├── styles.css      ← All styles
├── img/            ← Your local images (hero bg, loader logo, etc.)
└── SUPABASE_SETUP.md  ← This file
```

---

## Credentials to Change Before Going Live

In `script.js` find:
```js
const ADMIN_USER = 'dhannie';
const ADMIN_PASS = 'dhannie123';
```
Change these to something strong. Later you can replace with Supabase Auth.

---

## Common Issues

| Problem | Fix |
|---------|-----|
| "DB sync failed" toast | Check your URL and anon key are correct |
| Images not showing | Make sure bucket is **public** and policies allow SELECT |
| Products not saving | Check SQL policies allow INSERT/UPDATE |
| CORS error | In Supabase → Settings → API → add your site URL to allowed origins |
