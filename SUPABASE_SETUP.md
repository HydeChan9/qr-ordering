# Supabase Storage setup for ForgeKeys AU

This site can upload customer enquiries from GitHub Pages to Supabase Storage.

Important: direct browser-to-Storage upload is acceptable for early testing, but production should use a protected endpoint with CAPTCHA and rate limiting. A public website can always be scripted against, even when the frontend code has file checks.

## Recommended production architecture

Use:

- GitHub Pages for the static website
- Cloudflare Turnstile or another CAPTCHA before submission
- Supabase Edge Function or Cloudflare Worker as the upload endpoint
- Supabase Storage private bucket for files
- Server-side rate limiting by IP and email
- Server-side file size and MIME checks

Production flow:

```text
Customer browser
  -> CAPTCHA token
  -> Edge Function / Worker
  -> verify CAPTCHA
  -> enforce rate limit
  -> validate file size and MIME
  -> upload to private Supabase Storage using service role key on the server only
```

Never put a Supabase service role key in `site-config.js` or any frontend file.

## Current frontend limits

The website currently limits uploads in the browser:

- Max file size: 3 MB per file
- Accepted MIME types: image/jpeg, image/png, image/webp
- Demo SVG assets are not uploaded as customer originals

These checks improve UX but are not security controls by themselves.

## 1. Create a Supabase project

Create a project at Supabase, then copy:

- Project URL
- anon public key

The anon public key can be used in the frontend for testing. The service role key must stay server-side only.

## 2. Create a private Storage bucket

Create a bucket named:

```text
design-submissions
```

Recommended bucket settings:

- Public bucket: off
- File size limit: 3 MB to match the frontend
- Allowed MIME types: image/jpeg, image/png, image/webp, application/json

The proof image is uploaded as PNG. The enquiry summary is uploaded as JSON.

## 3. Testing-only direct upload policy

For early testing, you can allow anonymous uploads into the `submissions/` folder:

```sql
create policy "Allow public design submission uploads"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'design-submissions'
  and (storage.foldername(name))[1] = 'submissions'
);
```

Do not add a public select policy. Customers should not be able to read, list, update, or delete uploaded files.

Testing-only permissions:

- insert: yes, into `submissions/`
- select: no
- update: no
- delete: no
- bucket public: no

## 4. Configure direct upload testing

Edit `site-config.js`:

```js
window.FORGEKEYS_CONFIG = {
  submissionMode: "supabase",
  submissionEndpoint: "",
  supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
  supabaseAnonKey: "YOUR_ANON_PUBLIC_KEY",
  supabaseBucket: "design-submissions",
  supabaseFolder: "submissions",
  maxUploadBytes: 3 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
};
```

## 5. What gets uploaded

Each enquiry creates a folder:

```text
submissions/FK-xxxxxxxxxxxxx/
```

Inside it:

- `originals/` customer uploaded JPG/PNG/WebP files
- `proof/forgekeys-proof.png` watermarked proof image
- `submission.json` customer contact, design summary, key map, and artwork references

## 6. Production hardening checklist

Before real public launch, add:

- Server-side file size limit
- Server-side MIME allowlist
- CAPTCHA verification
- Rate limit by IP and email
- Abuse monitoring on Storage usage
- Email notification to ForgeKeys AU
- Optional manual approval before payment

Direct Supabase Storage upload from GitHub Pages should be treated as a testing bridge, not the final production security model.
