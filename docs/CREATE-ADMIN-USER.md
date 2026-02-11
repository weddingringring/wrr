# How to Create Admin Users - WeddingRingRing

## 🔐 Creating Your First Admin User

### Step 1: Create User in Supabase Auth
1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Users**
3. Click **Add User** (or **Invite User**)
4. Enter email address
5. Enter password (or user will get email invite)
6. Click **Create User**
7. **Copy the User ID** (UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

### Step 2: Create Profile and Set as Admin

Go to **SQL Editor** and run:

```sql
-- Replace YOUR-USER-ID-HERE with the actual UUID from Step 1
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR-USER-ID-HERE',
  'their-email@example.com',
  'Their Full Name',
  'admin',
  true
);
```

**Example:**
```sql
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  '2ebf5db7-cd8d-4a47-9a1e-d63b67086340',
  'weddingringring@gmail.com',
  'Admin User',
  'admin',
  true
);
```

---

### Step 3: Verify

```sql
-- Replace with the user's email
SELECT id, email, role, is_active, full_name
FROM profiles 
WHERE email = 'their-email@example.com';
```

**Should show:**
- `role` = `admin`
- `is_active` = `true`

---

## ✅ Done!

The user can now:
- Log in at `/admin/login`
- Access admin dashboard
- Manage all venues, events, and users

---

## 🔄 Adding Additional Admins Later

Repeat the same 3 steps for each new admin user:
1. Create in Auth Dashboard
2. Insert into profiles with `role = 'admin'`
3. Verify

---

## ⚠️ Security Notes

- Keep admin user list small
- Use strong passwords
- Don't share admin credentials
- Regularly review admin users

---

## 📋 Quick Reference

**Admin User Template:**
```sql
-- Step 1: Get User ID from Auth Dashboard
-- Step 2: Run this (replace placeholders)
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  'USER-ID-FROM-AUTH-DASHBOARD',
  'email@example.com',
  'Full Name',
  'admin',
  true
);

-- Step 3: Verify
SELECT email, role, is_active FROM profiles WHERE email = 'email@example.com';
```

---

**Last Updated:** 2026-02-11
