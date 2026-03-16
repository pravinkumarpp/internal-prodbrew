# Create a storage bucket in Supabase

Supabase provides **Storage** (S3-compatible), not direct AWS S3. Use it for client logos and other files.

---

## Your bucket: `ai-maintenance-client-logos`

- **Public**, 2 MB, `image/*` only.
- The add-client form uploads logos to this bucket and saves the public URL in `clients.logo_url`.

**Required: allow authenticated uploads.** Run this in **Supabase → SQL Editor** (once per project):

```sql
-- Allow authenticated users to upload to ai-maintenance-client-logos
CREATE POLICY "Authenticated upload client logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-maintenance-client-logos');

-- Allow anyone to read (public bucket)
CREATE POLICY "Public read client logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ai-maintenance-client-logos');
```

If you see "policy already exists", the bucket is already configured.

---

## 1. Open Storage

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left sidebar, click **Storage**.

---

## 2. Create a new bucket

1. Click **New bucket**.
2. **Name**: e.g. `client-logos` (lowercase, hyphens allowed).
3. **Public bucket**:  
   - Turn **ON** if you want logo URLs to be directly viewable (e.g. in `<img src="...">`) without signed URLs.  
   - Turn **OFF** if logos should be private (you’ll need to generate signed URLs to display them).
4. **File size limit** (optional): e.g. `1 MB` for logos.
5. **Allowed MIME types** (optional): e.g. `image/*` to allow only images.
6. Click **Create bucket**.

---

## 3. Set bucket policies (RLS)

By default, Storage uses policies so you need to allow access.

1. In **Storage**, open your bucket (e.g. `client-logos`).
2. Click the **Policies** tab (or the shield icon).
3. Click **New policy** and choose a template or write custom policies.

**Example – allow authenticated users to upload and read:**

- **Policy name**: `Authenticated users can upload and read`
- **Allowed operation**: `INSERT` and `SELECT` (or “All” for full access).
- **Target roles**: `authenticated`.
- **USING expression** (for SELECT): `true`
- **WITH CHECK expression** (for INSERT): `true`

Or run in the **SQL Editor**:

```sql
-- Allow authenticated users to upload to client-logos bucket
CREATE POLICY "Authenticated upload client logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-logos');

-- Allow public read if bucket is public (or use this for authenticated read)
CREATE POLICY "Public read client logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-logos');
```

Adjust `bucket_id` if your bucket name is different.

---

## 4. Get the public URL for a file

- **Public bucket**:  
  `https://<PROJECT_REF>.supabase.co/storage/v1/object/public/client-logos/<FILE_PATH>`

- **Private bucket**: use the Storage API to get a **signed URL** (temporary link) in your app.

Replace `<PROJECT_REF>` with your project reference (from Project Settings → General).

---

## 5. Use in your app

- **Upload**: use `supabase.storage.from('client-logos').upload(path, file, options)`.
- **Public URL**: store in `public.clients.logo_url` as  
  `https://<PROJECT_REF>.supabase.co/storage/v1/object/public/client-logos/<path>`.
- **Private URL**: generate a signed URL with `createSignedUrl()` and use that for display or store the path and generate the signed URL when loading the client.

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | Dashboard → **Storage** → **New bucket** |
| 2 | Name: `client-logos`, set Public ON/OFF, optional size/MIME limits |
| 3 | Create bucket |
| 4 | **Policies** → add policy so authenticated (or public) can INSERT/SELECT as needed |
| 5 | Use bucket name in app for uploads and build logo URLs for `clients.logo_url` |

{
    "id": "03fpipw66yyjj3288obhl4l",
    "accounts": [
        {
            "id": "03f5ixrsn62vpki5cki6i1u",
            "name": "Prodbrew",
            "slug": "/6108161",
            "created_at": "2025-12-04T05:42:35.453Z",
            "user": {
                "id": "03fpipw686vlxvutohakfpnzd",
                "name": "Jayakannan M",
                "role": "member",
                "active": true,
                "email_address": "jayakannan@mavencart.com",
                "created_at": "2026-03-06T08:30:14.888Z",
                "url": "https://app.fizzy.do/users/03fpipw686vlxvutohakfpnzd",
                "avatar_url": "https://app.fizzy.do/users/03fpipw686vlxvutohakfpnzd/avatar"
            }
        }
    ]
}
