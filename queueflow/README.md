# QueueFlow

A lightweight queue-management web app built with HTML, CSS, JavaScript and Supabase.

## Included
- Customer queue registration with automatically generated ticket numbers
- Private tracking code and live status lookup
- Queue position and estimated wait time
- QR code linking to the customer's tracking page
- Staff login and dashboard
- Call, serve and skip actions
- Supabase PostgreSQL database with Row Level Security

## Supabase project
- Project: `queueflow`
- Region: `eu-central-1` (Frankfurt)
- URL: `https://psrhpwkcmjcjgtbwepdh.supabase.co`

The browser configuration uses the project's **publishable** key. This key is intended for frontend use; database access is protected by RLS and server-side RPC functions. Never put a `service_role` key in frontend files.

## Run locally
1. Extract the ZIP.
2. Open the folder in VS Code.
3. Start a local static server (for example, the VS Code Live Server extension).
4. Open `index.html` through that local server.

A local server is recommended instead of opening the file directly.

## Staff account setup
Staff access is restricted to accounts explicitly added to `business_staff`.

1. In Supabase Dashboard → Authentication → Users, create a staff user.
2. Copy that user's UUID.
3. Open SQL Editor and run the following, replacing `PASTE_AUTH_USER_UUID` with the actual UUID:

```sql
insert into public.business_staff (business_id, user_id, role)
select id, 'PASTE_AUTH_USER_UUID'::uuid, 'owner'
from public.businesses
where slug = 'demo-center'
on conflict (business_id, user_id) do nothing;
```

4. Sign in at `staff.html` using that user's email and password.

Do not share staff credentials. Only trusted staff should be added to the membership table.

## Demo data
The database migration creates:
- QueueFlow Demo Center
- General Service (5 min/customer)
- Customer Support (8 min/customer)
- Payments (4 min/customer)

You can edit service names and average waiting estimates in Supabase Table Editor.

## Notes / current scope
- The app uses polling (7–12 seconds) for straightforward live updates.
- Ticket numbers are daily per service, with a short service prefix.
- This is a hackathon MVP, not a production deployment. Before real customer use, add stronger staff onboarding, audit logs, rate limiting, data-retention rules, abuse protection and operational monitoring.
- Supabase Free Plan has quotas and may pause inactive projects. Check your organization usage and billing dashboard regularly.
