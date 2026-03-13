# Invite email template (Supabase) – required for set-password flow

For "Accept invite" to open **our** confirmation page (where the user enters and confirms their password), the invite email link must point to our app, not Supabase’s default page.

## 1. Set Site URL

In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

- Set **Site URL** to your app origin, e.g.:
  - Local: `http://localhost:3000`
  - Production: `https://your-domain.com`

## 2. Add redirect URL

In the same **URL Configuration** section, under **Redirect URLs**, add:

- `http://localhost:3000/confirmation`
- `https://your-domain.com/confirmation` (when you deploy)

## 3. Change the Invite user email template

In **Supabase Dashboard** → **Authentication** → **Email Templates**, open **Invite user**.

Replace the default confirmation link with our confirmation URL that includes the token.

**Subject** (optional, you can keep the default):

```text
You have been invited
```

**Body** – use this link for “Accept invite” (replace the existing `<a href="...">` that uses `{{ .ConfirmationURL }}`):

```html
<h2>You have been invited</h2>

<p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite and set your password:</p>

<p><a href="{{ .SiteURL }}/confirmation?token_hash={{ .TokenHash }}&type=invite">Accept invite</a></p>

<p>If you did not expect this invite, you can ignore this email.</p>
```

Important: the link must be exactly:

```text
{{ .SiteURL }}/confirmation?token_hash={{ .TokenHash }}&type=invite
```

So that when the user clicks “Accept invite” they go to:

- `http://localhost:3000/confirmation?token_hash=...&type=invite` (local), or  
- `https://your-domain.com/confirmation?token_hash=...&type=invite` (production),

and our app shows the **Set your password** / **Confirm password** form. After they submit, we complete the invite and log them in.

If you leave the default template (link to Supabase’s verify page), users will set their password on Supabase’s page and may not see our confirmation UI.
