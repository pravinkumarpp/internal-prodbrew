# Database Schemas (Supabase / PostgreSQL)

This document describes the database tables and enums for the MaintainAI app. It aligns with `lib/types.ts`, the Team/Clients/Tasks UI, and planned monitoring/SSL features.

---

## 1. Auth (Supabase managed)

- **`auth.users`** – Managed by Supabase Auth. Do not add custom columns.
- Use **`public.users`** for app-specific fields (role, display name, etc.). Keep in sync via trigger on `auth.users` insert (e.g. when a user accepts an invite).

---

## 2. Public schema

### 2.1 Enums

```sql
-- Platform for a client/site (matches lib/types.ts Platform)
CREATE TYPE platform AS ENUM ('WordPress', 'Shopify', 'Next.js');

-- Client/site health status
CREATE TYPE client_status AS ENUM ('Healthy', 'Warning', 'Critical');

-- Team member role (matches TeamMember.role)
CREATE TYPE user_role AS ENUM ('Founder', 'Project Manager', 'Developer');

-- Task priority and status (matches lib/types.ts Task)
CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE task_status AS ENUM ('Backlog', 'In Progress', 'Review', 'Completed');
CREATE TYPE task_type AS ENUM ('AI Generated', 'Manual');
```

---

### 2.2 `public.users`

Extends Supabase Auth with app-specific profile and role. One row per auth user; create row when user is created in `auth.users` (e.g. via trigger when they accept an invite).

| Column       | Type         | Nullable | Description                    |
|-------------|--------------|----------|--------------------------------|
| `id`        | `uuid`       | NO       | PK, FK → `auth.users(id)`      |
| `email`     | `text`       | NO       | Synced from auth / invite      |
| `full_name` | `text`       | YES      | Display name                   |
| `role`      | `user_role`  | NO       | Founder, Project Manager, Developer |
| `avatar_url`| `text`       | YES      | Optional profile image         |
| `created_at`| `timestamptz`| NO       | Default `now()`                |
| `updated_at`| `timestamptz`| NO       | Default `now()`                |

```sql
CREATE TABLE public.users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  full_name  text,
  role       text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger: on auth.users insert, insert into public.users (so invite-accept creates both)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Developer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 2.3 `public.clients`

Clients/sites to monitor. Matches `Client` in `lib/types.ts`. Add-client form: website name, URL, platform, hosting provider, git repo URL.

| Column            | Type          | Nullable | Description                          |
|-------------------|---------------|----------|--------------------------------------|
| `id`              | `uuid`        | NO       | PK, default `gen_random_uuid()`      |
| `name`            | `text`        | NO       | Client/website name                   |
| `url`             | `text`        | NO       | Website URL (e.g. https://…)          |
| `platform`        | `platform`    | NO       | WordPress, Shopify, Next.js          |
| `status`          | `client_status`| NO      | Healthy, Warning, Critical (can be derived later) |
| `hosting_provider`| `text`        | YES      | e.g. AWS, Vercel                     |
| `git_repo_url`    | `text`        | YES      | Git repository URL                   |
| `logo_url`        | `text`        | YES      | Client logo image URL                |
| `slug`            | `text`        | YES      | Unique URL slug (e.g. `acme-corp`) for public form URL `/{slug}/form` |
| `basecamp_project_id` | `bigint`  | YES      | Basecamp project numeric ID (unique, from Basecamp API) |
| `bug_form_generated` | `boolean`  | NO       | Whether bug form URL has been generated (default false) |
| `created_at`      | `timestamptz` | NO       | Default `now()`                      |
| `updated_at`      | `timestamptz` | NO       | Default `now()`                      |

**Add slug and basecamp_project_id columns (if table already exists):** Run in Supabase SQL Editor:

```sql
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug text UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS clients_slug_key ON public.clients(slug) WHERE slug IS NOT NULL;

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS basecamp_project_id bigint UNIQUE;
```

New clients get a slug generated from the name when created via the app. Backfill existing rows if needed.

Derived (computed or from other tables) for UI: `uptime`, `ssl_expiry`, `open_tasks`, `last_backup` – can stay as app-level aggregates or be added as cached columns later.

```sql
CREATE TABLE public.clients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  url              text,
  platform         text,
  status           client_status NOT NULL DEFAULT 'Healthy',
  hosting_provider text,
  git_repo_url     text,
  logo_url         text,
  slug             text UNIQUE,
  basecamp_project_id bigint UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
```

---

### 2.4 `public.tasks`

Tasks per client. Used by the public Task Intake form (`/{slug}/form`) and by the admin Kanban. Each row is linked to a client via `client_id`.

| Column        | Type          | Nullable | Description                    |
|---------------|---------------|----------|--------------------------------|
| `id`          | `uuid`        | NO       | PK, default `gen_random_uuid()`|
| `client_id`   | `uuid`        | NO       | FK → `public.clients(id)`      |
| `title`       | `text`        | NO       | Task title                     |
| `priority`    | `text`        | NO       | From form: low, medium, high, urgent |
| `task_type`   | `text`        | NO       | From form: bug, feature, improvement, support |
| `description` | `text`        | YES      | Detailed description          |
| `status`      | `text`        | NO       | Backlog, In Progress, Review, Completed (default Backlog) |
| `assigned_to` | `uuid`        | YES      | FK → `public.users(id)`        |
| `basecamp_assignee_id` | `bigint` | YES | Basecamp person ID (from Basecamp API) |
| `basecamp_assignee_name` | `text` | YES | Basecamp person display name   |
| `source`      | `text`        | YES      | e.g. `public_form`, `manual`   |
| `created_at`  | `timestamptz` | NO       | Default `now()`                |
| `updated_at`  | `timestamptz` | NO       | Default `now()`                |

**Create table (run in Supabase SQL Editor):**

```sql
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title       text NOT NULL,
  priority    text NOT NULL,
  task_type   text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'Backlog',
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  basecamp_assignee_id bigint,
  basecamp_assignee_name text,
  source      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
```

Enable RLS and allow authenticated users to read/write (and allow the API to insert from the public form via service role). Public form submissions should set `source = 'public_form'`.

---

### 2.5 Monitoring (24/7 uptime) – planned

Sites to ping and history of checks. Used by dashboard and client uptime pages.

| Table / column | Description |
|----------------|-------------|
| **`public.sites`** (or `monitors`) | One row per URL to monitor: `id`, `client_id` (FK → clients), `url` (or reuse `clients.url`), `check_interval_minutes`, `is_active`, `created_at`, `updated_at`. |
| **`public.monitor_checks`** (or `uptime_logs`) | Time-series: `id`, `site_id`, `checked_at`, `status` (e.g. up/down), `response_time_ms`, `error_message` (nullable). |

---

### 2.6 SSL monitoring – planned

Certificate expiry and status per client/site.

| Table / column | Description |
|----------------|-------------|
| **`public.ssl_checks`** | Per client/site: `id`, `client_id` (or `site_id`), `domain`, `expiry_date` (date), `last_checked_at`, `issuer`, `status` (valid, warning, expired), `protocol` (e.g. TLS 1.3). Optional: history table for renewal events. |

---

## 3. Row Level Security (RLS)

- Enable RLS on `public.users`, `public.clients`, `public.tasks`.
- Policies: allow authenticated users to read/write as appropriate (e.g. all authenticated admins can read/write clients and tasks; users can read `public.users` for team list; only certain roles can invite or delete).
- Use `auth.uid()` in policies to restrict by current user when you add role-based rules later.

---

## 4. Summary

| Table            | Purpose                                      |
|------------------|----------------------------------------------|
| `auth.users`     | Supabase Auth (no custom columns).           |
| `public.users`   | Profile + role; synced from auth via trigger. |
| `public.clients` | Clients/sites; add-client form.              |
| `public.tasks`   | Tasks per client; Kanban / AI tasks.         |
| `public.sites`   | (Planned) URLs to monitor.                    |
| `public.monitor_checks` | (Planned) Uptime check history.       |
| `public.ssl_checks`     | (Planned) SSL expiry/status.          |

Enums and core tables (`users`, `clients`, `tasks`) align with `lib/types.ts` and the current UI. Monitoring and SSL tables can be added when you implement those features.
