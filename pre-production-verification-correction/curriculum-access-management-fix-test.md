# Curriculum Access Management - TEST GUIDE

**Feature URL:** https://portal.bda-global.org/admin/curriculum/access
**Related Fix:** curriculum-access-management-fix.md

---

## Pre-requisites

- Admin account credentials:
  - Email: `info@bda-global.org`
  - Password: `Shehabb.11`
- Browser: Chrome/Firefox (latest version)
- Clear browser cache before testing
- **IMPORTANT:** Database migration must be applied first:
  ```bash
  npx supabase db push
  ```
- Have at least 2-3 test user accounts created in the system with known emails

---

## Test Data Preparation

Before testing, ensure you have:
1. At least 2 users with accounts in the system (note their emails)
2. At least 1 email that does NOT have an account (for failure testing)

Example test emails:
- Valid user 1: `testuser1@example.com` (must exist in system)
- Valid user 2: `testuser2@example.com` (must exist in system)
- Invalid email: `nonexistent@fake.com` (must NOT exist)

---

## Test Cases

### Test 1: Navigate to Access Management

**Steps:**
1. Log in to the admin portal
2. Navigate to **Admin → Curriculum → Access Management**
   (or directly go to `/admin/curriculum/access`)

**Expected Result:**
- [ ] Access Management page loads
- [ ] Page title shows "Curriculum Access Management" (or Arabic equivalent)
- [ ] **"Grant Access"** button is visible
- [ ] Table/list of existing access records is shown (may be empty)

**Screenshot Required:** Yes - capture the Access Management page

---

### Test 2: Open Grant Access Modal

**Steps:**
1. Click the **"Grant Access"** button

**Expected Result:**
- [ ] Modal dialog opens
- [ ] Title shows "Grant Curriculum Access" or similar
- [ ] Form contains:
  - Email Addresses textarea
  - Certification Type dropdown (CP/SCP)
  - Exam Language dropdown (English/Arabic)
  - Duration (Months) field
- [ ] Cancel and Grant Access buttons are visible

**Screenshot Required:** Yes - capture the Grant Access modal

---

### Test 3: Test Single User Access Grant

**Steps:**
1. In the Grant Access modal
2. Enter ONE valid email: `info@bda-global.org` (or known test user)
3. Select Certification Type: **CP**
4. Select Exam Language: **English**
5. Set Duration: **12** months
6. Click **"Grant Access"**

**Expected Result:**
- [ ] Processing indicator appears
- [ ] Success toast notification appears
- [ ] Message shows "Access granted to 1 user(s) for 12 months"
- [ ] Modal closes
- [ ] New access record appears in the list

**Screenshot Required:** Yes - capture success message and new access in list

---

### Test 4: Verify Access Record Details

**Steps:**
1. Find the newly created access record in the list
2. Review its details

**Expected Result:**
- [ ] User email is displayed
- [ ] Certification type shows CP
- [ ] Language shows EN or English
- [ ] Status shows "Active" or similar
- [ ] Expiration date is approximately 12 months from now

**Screenshot Required:** Yes - capture access record details

---

### Test 5: Test Multiple Emails (Bulk Grant)

**Steps:**
1. Click **"Grant Access"**
2. Enter multiple emails:
   ```
   testuser1@example.com
   testuser2@example.com
   ```
3. Select Certification Type: **SCP**
4. Select Exam Language: **Arabic**
5. Set Duration: **6** months
6. Click **"Grant Access"**

**Expected Result:**
- [ ] Success message shows "Access granted to 2 user(s) for 6 months"
- [ ] Both access records appear in the list
- [ ] Both show SCP certification type
- [ ] Both show AR/Arabic language

**Screenshot Required:** Yes - capture success and new records

---

### Test 6: Test Invalid Email Handling

**Steps:**
1. Click **"Grant Access"**
2. Enter an email that does NOT have an account:
   ```
   nonexistent.user.fake@example.com
   ```
3. Fill other required fields
4. Click **"Grant Access"**

**Expected Result:**
- [ ] Error notification appears
- [ ] Message indicates user was not found
- [ ] Modal may stay open (no access granted)

**Screenshot Required:** Yes - capture the error message

---

### Test 7: Test Mixed Valid and Invalid Emails

**Steps:**
1. Click **"Grant Access"**
2. Enter mix of valid and invalid emails:
   ```
   info@bda-global.org
   fake.nonexistent@test.com
   testuser1@example.com
   ```
3. Fill other required fields
4. Click **"Grant Access"**

**Expected Result:**
- [ ] Partial success message appears
- [ ] Shows count of successfully granted access
- [ ] Shows list of failed emails
- [ ] Modal closes if at least one succeeded
- [ ] Successfully granted access appears in list

**Screenshot Required:** Yes - capture partial success message

---

### Test 8: Test Case-Insensitive Email

**Steps:**
1. Click **"Grant Access"**
2. Enter a valid email with DIFFERENT CASE:
   ```
   INFO@BDA-GLOBAL.ORG
   ```
3. Fill other required fields
4. Click **"Grant Access"**

**Expected Result:**
- [ ] User is found despite case difference
- [ ] Access is granted successfully
- [ ] No "user not found" error

**Screenshot Required:** Yes - capture successful grant

---

### Test 9: Test Activate/Deactivate Access

**Steps:**
1. Find an existing access record in the list
2. If there's an **Activate/Deactivate** toggle or button, click it

**Expected Result:**
- [ ] Status changes appropriately
- [ ] Success notification appears
- [ ] List updates to show new status

**Screenshot Required:** Yes - capture status change

---

### Test 10: Test Extend Access (+1 Year)

**Steps:**
1. Find an existing access record
2. If there's an **Extend** or **+1 Year** button, click it

**Expected Result:**
- [ ] Confirmation dialog may appear
- [ ] After confirmation, expiration date extends by 1 year
- [ ] Success notification appears
- [ ] List updates to show new expiration date

**Screenshot Required:** Yes - capture extension result

---

### Test 11: Test Empty Email Validation

**Steps:**
1. Click **"Grant Access"**
2. Leave Email Addresses field empty
3. Fill other required fields
4. Click **"Grant Access"**

**Expected Result:**
- [ ] Validation error appears
- [ ] Message says "Please enter at least one valid email address"
- [ ] Form does not submit

**Screenshot Required:** Yes - capture validation error

---

### Test 12: Verify User Can Access Learning System

**Steps:**
1. After granting access to a user
2. Log out from admin
3. Log in as the user who was granted access
4. Navigate to Learning System / Curriculum

**Expected Result:**
- [ ] User can access the curriculum modules
- [ ] Access is for the correct certification type (CP/SCP)
- [ ] Access is for the correct language (EN/AR)

**Screenshot Required:** Yes - capture user's curriculum access

---

## Test Summary

| Test # | Description | Pass/Fail | Notes |
|--------|-------------|-----------|-------|
| 1 | Navigate to Access Management | | |
| 2 | Grant Access modal opens | | |
| 3 | Single user access grant | | |
| 4 | Access record details | | |
| 5 | Multiple emails bulk grant | | |
| 6 | Invalid email handling | | |
| 7 | Mixed valid/invalid emails | | |
| 8 | Case-insensitive email | | |
| 9 | Activate/Deactivate | | |
| 10 | Extend access | | |
| 11 | Empty email validation | | |
| 12 | User can access curriculum | | |

---

## Database Migration Check

Before testing, verify the migration was applied:

```sql
-- Check if the function exists
SELECT proname FROM pg_proc WHERE proname = 'admin_grant_curriculum_access';

-- Should return: admin_grant_curriculum_access
```

If the function doesn't exist, the migration needs to be applied.

---

## Issues Found

| Issue # | Description | Severity | Screenshot |
|---------|-------------|----------|------------|
| | | | |

---

## Sign-off

- **Tester Name:** _______________
- **Test Date:** _______________
- **Overall Result:** [ ] PASS / [ ] FAIL
- **Database Migration Applied:** [ ] YES / [ ] NO
- **Comments:** _______________
