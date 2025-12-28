# Exam Vouchers - Bulk Issuance - TEST GUIDE

**Feature URL:** https://portal.bda-global.org/admin/vouchers
**Related Fix:** vouchers-bulk-issuance-fix.md

---

## Pre-requisites

- Admin account credentials:
  - Email: `info@bda-global.org`
  - Password: `Shehabb.11`
- Browser: Chrome/Firefox (latest version)
- Clear browser cache before testing
- **IMPORTANT:** Have at least 2-3 test user accounts created in the system with known emails

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

### Test 1: Verify Bulk Issue Button Exists

**Steps:**
1. Log in to the admin portal
2. Navigate to **Admin → Vouchers**
3. Look for the action buttons

**Expected Result:**
- [ ] **"Bulk Issue"** button is visible in the actions area
- [ ] Button has Users icon

**Screenshot Required:** Yes - capture the Vouchers page with Bulk Issue button

---

### Test 2: Open Bulk Issue Modal

**Steps:**
1. Click the **"Bulk Issue"** button

**Expected Result:**
- [ ] Modal dialog opens
- [ ] Title shows "Bulk Issue Vouchers"
- [ ] Form contains:
  - Email Addresses textarea
  - Certification Type dropdown
  - Exam Language dropdown
  - Expires At date picker
  - Admin Notes textarea
- [ ] Cancel and Issue Vouchers buttons are visible

**Screenshot Required:** Yes - capture the Bulk Issue modal

---

### Test 3: Verify Email Input Field

**Steps:**
1. In the Bulk Issue modal
2. Review the Email Addresses field

**Expected Result:**
- [ ] Large textarea for entering multiple emails
- [ ] Placeholder text shows example format
- [ ] Help text mentions "comma or newline separated"

**Screenshot Required:** Yes - capture the email input area

---

### Test 4: Test Single Valid Email

**Steps:**
1. Enter ONE valid email: `info@bda-global.org` (or known test user)
2. Select Certification Type: **CP**
3. Select Exam Language: **English**
4. Set Expires At: A date in the future (e.g., 6 months from now)
5. Click **"Issue Vouchers"**

**Expected Result:**
- [ ] Loading spinner appears during processing
- [ ] Success toast notification appears
- [ ] Message shows "1 voucher(s) created successfully"
- [ ] Modal closes
- [ ] New voucher appears in the list

**Screenshot Required:** Yes - capture success message and new voucher in list

---

### Test 5: Test Multiple Valid Emails (Comma-Separated)

**Steps:**
1. Click **"Bulk Issue"** again
2. Enter multiple emails separated by commas:
   ```
   testuser1@example.com, testuser2@example.com
   ```
3. Select Certification Type: **SCP**
4. Select Exam Language: **Arabic**
5. Set Expires At: Future date
6. Click **"Issue Vouchers"**

**Expected Result:**
- [ ] Success toast shows "2 voucher(s) created successfully"
- [ ] Both vouchers appear in the list
- [ ] Both show SCP certification type
- [ ] Both show AR language

**Screenshot Required:** Yes - capture success and new vouchers

---

### Test 6: Test Multiple Emails (Newline-Separated)

**Steps:**
1. Click **"Bulk Issue"**
2. Enter emails on separate lines:
   ```
   testuser1@example.com
   testuser2@example.com
   ```
3. Fill other required fields
4. Click **"Issue Vouchers"**

**Expected Result:**
- [ ] Newline separation works correctly
- [ ] Vouchers created for all valid emails

**Screenshot Required:** Yes - capture result

---

### Test 7: Test Case-Insensitive Email Lookup

**Steps:**
1. Click **"Bulk Issue"**
2. Enter a valid email with DIFFERENT CASE:
   ```
   INFO@BDA-GLOBAL.ORG
   ```
   (or use uppercase version of a known user email)
3. Fill other required fields
4. Click **"Issue Vouchers"**

**Expected Result:**
- [ ] User is found despite case difference
- [ ] Voucher is created successfully
- [ ] No "user not found" error

**Screenshot Required:** Yes - capture successful creation with case-different email

---

### Test 8: Test Invalid Email (User Not Found)

**Steps:**
1. Click **"Bulk Issue"**
2. Enter an email that does NOT have an account:
   ```
   nonexistent.user.fake@example.com
   ```
3. Fill other required fields
4. Click **"Issue Vouchers"**

**Expected Result:**
- [ ] Toast notification appears with failure details
- [ ] Message shows "0 voucher(s) created successfully"
- [ ] Failed email is listed with reason: "User not found - must create account first"
- [ ] Modal stays open (no vouchers created)

**Screenshot Required:** Yes - capture the failure message with details

---

### Test 9: Test Mixed Valid and Invalid Emails

**Steps:**
1. Click **"Bulk Issue"**
2. Enter mix of valid and invalid emails:
   ```
   info@bda-global.org
   fake.nonexistent@test.com
   testuser1@example.com
   another.fake@nowhere.com
   ```
3. Fill other required fields
4. Click **"Issue Vouchers"**

**Expected Result:**
- [ ] Partial success message appears
- [ ] Shows count of successfully created vouchers
- [ ] Shows list of failed emails with reasons
- [ ] Each failed email shows: `email: User not found - must create account first`
- [ ] Modal closes (some vouchers were created)
- [ ] Successfully created vouchers appear in list

**Screenshot Required:** Yes - capture the detailed failure/success message

---

### Test 10: Test Empty Email Field Validation

**Steps:**
1. Click **"Bulk Issue"**
2. Leave Email Addresses field empty
3. Fill other required fields
4. Click **"Issue Vouchers"**

**Expected Result:**
- [ ] Error message appears
- [ ] Says "Please enter at least one email address"
- [ ] Form does not submit

**Screenshot Required:** Yes - capture validation error

---

### Test 11: Test Missing Expiration Date Validation

**Steps:**
1. Click **"Bulk Issue"**
2. Enter a valid email
3. Select certification type and language
4. Leave Expires At field empty
5. Click **"Issue Vouchers"**

**Expected Result:**
- [ ] Error message appears
- [ ] Says "Please select an expiration date"
- [ ] Form does not submit

**Screenshot Required:** Yes - capture validation error

---

### Test 12: Verify Created Vouchers Details

**Steps:**
1. After creating vouchers via bulk issuance
2. Find one of the newly created vouchers in the list
3. Review its details

**Expected Result:**
- [ ] Voucher code is displayed (format: BDA-CP-EN-XXXXX or similar)
- [ ] Certification type matches selection
- [ ] Exam language matches selection (EN/AR badge)
- [ ] User email is displayed
- [ ] Expiration date matches selection
- [ ] Status shows "Unused" or "Available"

**Screenshot Required:** Yes - capture voucher details in list

---

## Test Summary

| Test # | Description | Pass/Fail | Notes |
|--------|-------------|-----------|-------|
| 1 | Bulk Issue button exists | | |
| 2 | Modal opens correctly | | |
| 3 | Email input field works | | |
| 4 | Single valid email | | |
| 5 | Multiple emails (comma) | | |
| 6 | Multiple emails (newline) | | |
| 7 | Case-insensitive lookup | | |
| 8 | Invalid email handling | | |
| 9 | Mixed valid/invalid | | |
| 10 | Empty email validation | | |
| 11 | Missing date validation | | |
| 12 | Voucher details correct | | |

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
- **Comments:** _______________
