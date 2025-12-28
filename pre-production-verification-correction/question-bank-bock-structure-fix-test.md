# Question Bank - BDA BoCK Structure Alignment - TEST GUIDE

**Feature URL:** https://portal.bda-global.org/admin/question-bank
**Related Fix:** question-bank-bock-structure-fix.md

---

## Pre-requisites

- Admin account credentials:
  - Email: `info@bda-global.org`
  - Password: `Shehabb.11`
- Browser: Chrome/Firefox (latest version)
- Clear browser cache before testing

---

## Test Cases

### Test 1: Verify BDA BoCK Structure Linkage Section

**Steps:**
1. Log in to the admin portal
2. Navigate to **Admin → Question Bank**
3. Click the **"Create Question Set"** button

**Expected Result:**
- [ ] A modal dialog opens
- [ ] A highlighted blue section titled **"BDA BoCK™ Structure Linkage"** is visible at the top
- [ ] The section contains two dropdowns: "Competency Module" and "Sub-competency"

**Screenshot Required:** Yes - capture the Create Question Set modal

---

### Test 2: Verify Competency Dropdown

**Steps:**
1. In the Create Question Set modal
2. Click on the **"Competency Module"** dropdown

**Expected Result:**
- [ ] Dropdown shows list of competencies (numbered 1-14)
- [ ] Competencies have format: "1. [Competency Name]"
- [ ] "None" option is available at the top

**Screenshot Required:** Yes - capture the competency dropdown expanded

---

### Test 3: Verify Sub-competency Filtering

**Steps:**
1. Select a competency (e.g., competency #1)
2. Click on the **"Sub-competency"** dropdown

**Expected Result:**
- [ ] Sub-competency dropdown becomes enabled (was disabled before)
- [ ] Shows only sub-competencies related to the selected competency
- [ ] Sub-competencies have format: "[Order]. [Title]"

**Screenshot Required:** Yes - capture the sub-competency dropdown

---

### Test 4: Verify EN/AR Language Tabs

**Steps:**
1. In the Create Question Set modal
2. Look below the BDA BoCK linkage section

**Expected Result:**
- [ ] Two tabs are visible: **"English Version"** and **"Arabic Version"**
- [ ] English tab is selected by default (blue highlight)
- [ ] English tab shows Name and Description fields

**Screenshot Required:** Yes - capture the tabs section

---

### Test 5: Verify Arabic Tab with RTL Support

**Steps:**
1. Click on the **"Arabic Version"** tab

**Expected Result:**
- [ ] Tab switches to Arabic content (green highlight)
- [ ] Arabic Name field has `dir="rtl"` (text aligns right)
- [ ] Arabic Description field has `dir="rtl"` (text aligns right)
- [ ] Placeholder text is in Arabic: "أدخل اسم مجموعة الأسئلة..."

**Screenshot Required:** Yes - capture the Arabic tab

---

### Test 6: Test Arabic Text Entry

**Steps:**
1. In the Arabic Version tab
2. Type Arabic text in the Name field: `أسئلة تحليل الأعمال`
3. Type Arabic text in the Description field: `مجموعة أسئلة للوحدة الأولى`

**Expected Result:**
- [ ] Text flows from right-to-left
- [ ] Text is properly aligned to the right
- [ ] Cursor moves correctly for RTL text

**Screenshot Required:** Yes - capture with Arabic text entered

---

### Test 7: Create Question Set with All Data

**Steps:**
1. Select a Competency Module
2. Select a Sub-competency
3. Fill English Name: "Business Analysis Fundamentals"
4. Fill English Description: "Questions for Module 1"
5. Switch to Arabic tab
6. Fill Arabic Name: "أساسيات تحليل الأعمال"
7. Fill Arabic Description: "أسئلة للوحدة الأولى"
8. Click **"Create"** button

**Expected Result:**
- [ ] Question Set is created successfully
- [ ] Success toast notification appears
- [ ] New question set appears in the list
- [ ] Question set shows under the correct competency in tree view

**Screenshot Required:** Yes - capture the success message and the new entry in list

---

### Test 8: Verify Question Set in List View

**Steps:**
1. Find the newly created question set in the list
2. Check its grouping in the tree view

**Expected Result:**
- [ ] Question set appears under the selected competency
- [ ] Both English and Arabic names are visible (if tree view supports it)

**Screenshot Required:** Yes - capture the tree view with the new question set

---

## Test Summary

| Test # | Description | Pass/Fail | Notes |
|--------|-------------|-----------|-------|
| 1 | BDA BoCK Section visible | | |
| 2 | Competency dropdown works | | |
| 3 | Sub-competency filters correctly | | |
| 4 | EN/AR tabs visible | | |
| 5 | Arabic tab RTL support | | |
| 6 | Arabic text entry works | | |
| 7 | Create question set | | |
| 8 | List view shows correctly | | |

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
