# ForgeKeys Supabase Storage Setup

The static GitHub Pages site uploads customer design files directly to Supabase Storage with the public anon key in `site-config.js`.

The `403 Unauthorized` error with `new row violates row-level security policy` means the bucket exists, but Supabase Storage RLS does not allow anonymous uploads yet.

## Required bucket

- Bucket name: `design-submissions`
- Recommended: private bucket

## Storage policy

Open Supabase Dashboard, then go to **SQL Editor** and run this:

```sql
create policy "ForgeKeys public submission uploads"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'design-submissions'
  and name like 'submissions/%'
  and (
    lower(name) like '%.png'
    or lower(name) like '%.jpg'
    or lower(name) like '%.jpeg'
    or lower(name) like '%.webp'
    or lower(name) like '%.json'
    or lower(name) like '%.txt'
  )
);
```

Do not add a public `select` policy unless you want visitors to read uploaded customer files. For customer artwork, keep the bucket private and view files from the Supabase dashboard.

## What a successful submission uploads

Each order creates a folder like:

```text
submissions/FK-1779166909363/
```

Inside it:

- `preview.png`: customer-facing keyboard preview
- `main-artwork-*`: original main image
- `accents/*`: original per-key images
- `design.json`: design settings and contact details
- `01-order-details.json`: same order data, easier to spot in the dashboard
- `00-read-me-first.txt`: quick production notes

Build reference quote requests from `products.html` / `support.html` create folders like:

```text
submissions/FQ-1779166909363/
```

Inside it:

- `01-quote-request-*.json`: selected product reference, customer contact, and brief
- `00-read-me-first.txt`: quick note for the quote request

## Frontend upload limits

The current browser-side limits are in `site-config.js`:

- Images only: JPEG, PNG, WEBP
- Maximum file size: 3 MB per uploaded image

For stronger protection, add CAPTCHA or move uploads through a small backend function before launch.
