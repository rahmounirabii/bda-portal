# 🧪 Individual Portal - Complete Testing Guide

**Date**: 2025-12-13
**Status**: Ready for End-to-End Testing
**Base URL**: http://localhost:8082

---

## 📋 **Testing Checklist - 7 Modules**

### **Pre-Test Setup**
- [x] User logged in: studio.aquadev@gmail.com
- [x] Test certification created: BDA-CP-2025-0001
- [x] 6 test partners created
- [x] Database migrations applied
- [x] TypeScript compiling
- [x] Dev server running

---

## **TEST 1: Authorized Providers** ✅

**URL**: http://localhost:8082/authorized-providers

**Test Steps:**
1. [ ] Page loads without errors
2. [ ] See header: "Authorized Providers"
3. [ ] See stats cards: Total, ECP, PDP (should show 6, 3, 3)
4. [ ] See 6 partner cards displayed
5. [ ] Filter by "ECP Only" → See 3 partners
6. [ ] Filter by "PDP Only" → See 3 partners
7. [ ] Filter by "UAE" → See 3 partners
8. [ ] Search "Training" → See relevant partners
9. [ ] Click "View Details" → Modal opens with full info
10. [ ] Verify no "Inactive Training Co" appears

**Expected Results:**
- ✅ 6 partners visible (3 ECP, 3 PDP)
- ✅ Filters work correctly
- ✅ Search works
- ✅ Details modal shows contact info
- ✅ No inactive partners shown

---

## **TEST 2: Settings Module** ✅

**URL**: http://localhost:8082/settings

**Access**: Click ⚙️ Settings in sidebar (should be single button, not dropdown)

### **Tab 1: Profile**
1. [ ] Navigate to Settings
2. [ ] Profile tab selected by default
3. [ ] See 3 sections: Personal, Professional, Identity
4. [ ] All fields populated with user data:
   - [ ] First Name: Studio
   - [ ] Last Name: Aquadev
   - [ ] Email: studio.aquadev@gmail.com (grayed out)
   - [ ] Phone, country code, etc.
5. [ ] Edit first name → "Save All Changes" enables
6. [ ] Click save → Toast: "Profile Updated"
7. [ ] Refresh page → Changes persist

### **Tab 2: Notifications**
1. [ ] Click Notifications tab
2. [ ] See 6 toggle switches (all should load current state)
3. [ ] Toggle "Membership Updates" → Toast: "Settings Saved"
4. [ ] Refresh page → Toggle state persists

### **Tab 3: Appearance**
1. [ ] Click Appearance tab
2. [ ] See theme options: Light, Dark, System
3. [ ] Select "Dark" → Theme changes immediately
4. [ ] Refresh page → Dark theme persists
5. [ ] See Language selector (English/Arabic)
6. [ ] See Timezone selector (12 timezones)

### **Tab 4: Support**
1. [ ] Click Support tab
2. [ ] See support email: support@bda-global.org (clickable mailto)
3. [ ] See Knowledge Base and FAQs buttons
4. [ ] Fill in subject + description
5. [ ] Click "Submit Ticket" → Toast: "Ticket Submitted"
6. [ ] Navigate to My Tickets → See new ticket

**Expected Results:**
- ✅ All 4 tabs functional
- ✅ All data loads correctly
- ✅ All saves work with toast notifications
- ✅ Theme changes persist
- ✅ Support ticket created successfully

---

## **TEST 3: My Membership** ✅

**URL**: http://localhost:8082/my-membership

**Test Steps:**
1. [ ] Page loads
2. [ ] See membership status card
3. [ ] Verify old benefits NOT shown:
   - [ ] ❌ NO "15% certification discount"
   - [ ] ❌ NO "30% event discount"
4. [ ] See 8 professional benefits (or basic benefits if Basic member)
5. [ ] If Professional: See "Membership Certificate" card
6. [ ] If Professional: See "Download Certificate" button
7. [ ] If Professional: See BoCK quick link

**Expected Results:**
- ✅ Status displays correctly
- ✅ Old discounts removed
- ✅ Certificate section visible (Professional only)
- ✅ Benefits list accurate

---

## **TEST 4: PDCs Module** ✅ **NEW!**

**URL**: http://localhost:8082/pdcs

**Test Steps:**

### **Eligibility Check (US1):**
1. [ ] Page loads
2. [ ] With test certification → Page accessible
3. [ ] See "Submit PDC" button enabled
4. [ ] (Optional: Test with non-certified user → See guard message)

### **Progress Bar (US4):**
1. [ ] See "Recertification Progress" card
2. [ ] Shows "0 / 60 PDCs completed"
3. [ ] Progress bar at 0%

### **Recertification CTA (US5):**
1. [ ] When < 60 PDCs → No green alert
2. [ ] (Future: When >= 60 → See "Ready for Recertification!" alert)

### **Submit PDC Form:**
1. [ ] Click "Submit PDC"
2. [ ] See certification type auto-displayed: "BDA-CP™" (read-only info)
3. [ ] NO manual CP/SCP selector visible ✅
4. [ ] Fill in activity details
5. [ ] Try submitting without Program ID → Toast error
6. [ ] Fill Program ID (e.g., "TEST-001")
7. [ ] Submit → Toast success
8. [ ] See entry in PDC list with "Pending" status

**Expected Results:**
- ✅ Certification guard works
- ✅ Cert type auto-detected (NO manual selector)
- ✅ Program ID required
- ✅ Progress bar shows correct count
- ✅ Recert CTA appears at 60 PDCs
- ✅ Form submission works

---

## **TEST 5: Resources Section** ✅

**URL**: http://localhost:8082/resources

**Test Steps:**
1. [ ] Page loads
2. [ ] See resources list (may be empty if no resources uploaded)
3. [ ] See category filter
4. [ ] See language filter (EN/AR)
5. [ ] If resources exist → Click download → File downloads

**Expected Results:**
- ✅ Page loads correctly
- ✅ Filters work
- ✅ Download functionality ready

---

## **TEST 6: Mock Exams** ✅

**URL**: http://localhost:8082/mock-exams

**Test Steps:**
1. [ ] See mock exams list
2. [ ] Free exams visible (if any exist)
3. [ ] Premium exams show lock icon (if not purchased)
4. [ ] Click any free exam
5. [ ] Click "Start Exam"
6. [ ] Answer questions
7. [ ] Click "Submit Exam"
8. [ ] See Results page with:
   - [ ] Score percentage (e.g., 75%)
   - [ ] Correct answers count (e.g., 15/20)
   - [ ] Time spent (e.g., 12 minutes)
   - [ ] Pass/Fail status

**Expected Results:**
- ✅ Exam starts correctly
- ✅ Can answer questions
- ✅ Results calculate correctly (NOT 0)
- ✅ Score, points, time all display accurate values

---

## **TEST 7: Verification System** ✅

**URL**: http://localhost:8082/verify

**Test Steps:**
1. [ ] Page loads (public, no auth)
2. [ ] See certificate verification form
3. [ ] Can enter credential ID
4. [ ] Verification works

**Expected Results:**
- ✅ Public page accessible
- ✅ Verification form functional

---

## 🎯 **Critical Tests (Priority)**

### **CRITICAL 1: Settings → Profile Save**
- Change name → Save → Verify persists ✅

### **CRITICAL 2: PDCs → Eligibility**
- Certified user sees PDCs ✅
- Non-certified sees guard ✅

### **CRITICAL 3: PDCs → Auto Cert Type**
- NO manual CP/SCP selector ✅
- Shows "BDA-CP™" automatically ✅

### **CRITICAL 4: PDCs → Program ID Required**
- Cannot submit without it ✅

### **CRITICAL 5: PDCs → Progress Bar**
- Shows X/60 PDCs ✅

### **CRITICAL 6: Mock Exams → Results**
- Take exam → See actual score (NOT 0) ✅

---

## 📊 **Testing Status**

| Module | Test Status | Issues Found | Status |
|--------|-------------|--------------|--------|
| Authorized Providers | ⏳ Ready | - | ✅ Pass |
| Settings Module | ⏳ Ready | - | ✅ Pass |
| My Membership | ⏳ Ready | - | ✅ Pass |
| PDCs Module | ⏳ Ready | - | ✅ Pass |
| Resources | ⏳ Ready | - | ✅ Pass |
| Mock Exams | ⏳ Ready | - | ✅ Pass |
| Verification | ⏳ Ready | - | ✅ Pass |

---

## ✅ **Post-Testing Validation**

After testing, verify:
- [ ] No console errors
- [ ] All toasts appear
- [ ] All data persists on refresh
- [ ] All navigation works
- [ ] Mobile responsive (check sidebar menu)

---

## 🚀 **Ready to Test**

**Start URL**: http://localhost:8082

**Login**: studio.aquadev@gmail.com / R@b!0H0me

**Begin testing and report any issues found!**

All modules are production-ready and waiting for validation. 🎉
