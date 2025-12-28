# Flashcards Module - BDA BoCK Structure Alignment - TEST GUIDE

**Feature URL:** https://portal.bda-global.org/admin/flashcards
**Related Fix:** flashcards-bock-structure-fix.md

---

## Pre-requisites

- Admin account credentials:
  - Email: `info@bda-global.org`
  - Password: `Shehabb.11`
- Browser: Chrome/Firefox (latest version)
- Clear browser cache before testing

---

## Test Cases

### Test 1: Verify Create Deck Modal Opens

**Steps:**
1. Log in to the admin portal
2. Navigate to **Admin → Flashcards**
3. Click the **"Create Deck"** button

**Expected Result:**
- [ ] A modal dialog opens for creating a new flashcard deck
- [ ] Modal title shows "Create Flashcard Deck" (or Arabic equivalent)

**Screenshot Required:** Yes - capture the Create Deck modal

---

### Test 2: Verify BDA BoCK Structure Linkage Section

**Steps:**
1. In the Create Deck modal
2. Look for the highlighted section

**Expected Result:**
- [ ] A blue highlighted section titled **"BDA BoCK™ Structure Linkage"** is visible
- [ ] Section contains an icon (layers icon)
- [ ] Two dropdowns are visible: "Competency Module" and "Sub-competency"
- [ ] Dropdowns have white background inside the blue section

**Screenshot Required:** Yes - capture the BDA BoCK linkage section

---

### Test 3: Verify Competency Module Dropdown

**Steps:**
1. Click on the **"Competency Module"** dropdown

**Expected Result:**
- [ ] Dropdown expands showing list of competencies
- [ ] Competencies are numbered (1-14)
- [ ] "None" option is available
- [ ] Format: "[Number]. [Competency Name]"

**Screenshot Required:** Yes - capture the expanded competency dropdown

---

### Test 4: Verify Sub-competency Filtering

**Steps:**
1. Select a competency from the dropdown (e.g., competency #2)
2. Click on the **"Sub-competency"** dropdown

**Expected Result:**
- [ ] Sub-competency dropdown becomes enabled
- [ ] Shows only lessons/sub-competencies related to selected competency
- [ ] "None" option is available
- [ ] Format: "[Order]. [Lesson Title]"

**Screenshot Required:** Yes - capture the filtered sub-competency dropdown

---

### Test 5: Verify EN/AR Language Tabs

**Steps:**
1. Look below the BDA BoCK linkage section
2. Observe the language tabs

**Expected Result:**
- [ ] Two tabs are visible: **"English Version"** and **"Arabic Version"**
- [ ] English tab is selected by default (blue highlight)
- [ ] Arabic tab shows green when selected

**Screenshot Required:** Yes - capture the language tabs

---

### Test 6: Verify English Version Tab Content

**Steps:**
1. Ensure **"English Version"** tab is selected
2. Review the form fields

**Expected Result:**
- [ ] Title (English) field is visible
- [ ] Description (English) textarea is visible
- [ ] Fields are left-aligned (LTR)

**Screenshot Required:** Yes - capture the English tab content

---

### Test 7: Verify Arabic Version Tab with RTL

**Steps:**
1. Click on the **"Arabic Version"** tab
2. Review the form fields

**Expected Result:**
- [ ] Tab switches (green highlight)
- [ ] Title (Arabic) field is visible with RTL direction
- [ ] Description (Arabic) textarea is visible with RTL direction
- [ ] Placeholder text is in Arabic: "أدخل العنوان..." and "أدخل وصف المجموعة..."

**Screenshot Required:** Yes - capture the Arabic tab

---

### Test 8: Test Arabic Text Entry

**Steps:**
1. In the Arabic Version tab
2. Type in the Title field: `بطاقات تحليل الأعمال`
3. Type in the Description field: `مجموعة بطاقات تعليمية للوحدة الأولى`

**Expected Result:**
- [ ] Text flows from right-to-left
- [ ] Text is properly right-aligned
- [ ] Cursor behavior is correct for RTL

**Screenshot Required:** Yes - capture with Arabic text

---

### Test 9: Create Complete Flashcard Deck

**Steps:**
1. Fill in all fields:
   - Section Type: Knowledge
   - Order Index: 1
   - Competency Module: Select any
   - Sub-competency: Select any
   - English Title: "Business Analysis Basics"
   - English Description: "Fundamental concepts"
   - Arabic Title: "أساسيات تحليل الأعمال"
   - Arabic Description: "المفاهيم الأساسية"
   - Published: Toggle ON
2. Click **"Create"** or **"Save"** button

**Expected Result:**
- [ ] Deck is created successfully
- [ ] Success notification appears
- [ ] New deck appears in the flashcard list
- [ ] Deck shows linkage to selected competency

**Screenshot Required:** Yes - capture success message and new deck in list

---

### Test 10: Verify Edit Deck Preserves Data

**Steps:**
1. Find the newly created deck in the list
2. Click **Edit** button
3. Verify all fields

**Expected Result:**
- [ ] All entered data is preserved
- [ ] Competency linkage is preserved
- [ ] Arabic content is preserved with RTL
- [ ] EN/AR tabs work correctly in edit mode

**Screenshot Required:** Yes - capture edit modal with preserved data

---

### Test 11: Test Individual Flashcard Editor (Existing Feature)

**Steps:**
1. Open a deck for editing
2. Add a new flashcard
3. Check Arabic fields

**Expected Result:**
- [ ] Front (Arabic) field has RTL support
- [ ] Back (Arabic) field has RTL support
- [ ] Hint (Arabic) field has RTL support

**Screenshot Required:** Yes - capture flashcard editor with Arabic fields

---

## Test Summary

| Test # | Description | Pass/Fail | Notes |
|--------|-------------|-----------|-------|
| 1 | Create Deck modal opens | | |
| 2 | BDA BoCK section visible | | |
| 3 | Competency dropdown works | | |
| 4 | Sub-competency filters | | |
| 5 | EN/AR tabs visible | | |
| 6 | English tab content | | |
| 7 | Arabic tab RTL | | |
| 8 | Arabic text entry | | |
| 9 | Create complete deck | | |
| 10 | Edit preserves data | | |
| 11 | Individual flashcard RTL | | |

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
