# PDCs Module - Implementation Status

**Document**: 4/20
**Status**: ⚠️ **NEEDS 6 UPDATES**

## Required Changes

### **US1: Certification Eligibility Check**
**Status**: ❌ NOT IMPLEMENTED
- Add: `useUserCertifications(user?.id)` at top of component
- Show guard: "You must be certified to submit PDCs" if no active cert
- Hide submit button if not certified

### **US2: Auto Cert Type Detection**
**Status**: ❌ CURRENTLY MANUAL (lines 196-208)
**Action**: REMOVE certification type selector
**Replace with**: Auto-detect from `userCertifications[0].certification_type`

### **US3: Program ID Validation**
**Status**: ⚠️ OPTIONAL (should be MANDATORY)
- Make `program_id` field required in form
- Add validation: min 3 characters
- Add API validation against pdp_programs table

### **US4: Progress Bar**
**Status**: ❌ NOT SHOWN
- Calculate: `approvedPDCs / 60 * 100`
- Add Progress component showing X/60 PDCs
- Update as admin approves

### **US5: Recertification CTA**
**Status**: ❌ NOT SHOWN
- Check if `cpSummary.approved >= 60` OR `scpSummary.approved >= 60`
- Show success card with "Purchase Recertification" button
- Link: https://bda-global.org/en/store/bda-recertification/

### **US6: Admin Validation**
**Status**: ✅ ALREADY HANDLED (admin panel)

## Test Data Created
- ✅ Test certification: BDA-CP-2025-0001 (active, user: studio.aquadev@gmail.com)

## Quick Fix Summary
**Files**: 1 file (PDCs.tsx)
**Lines to change**: ~50-100 lines
**Time**: 30-60 minutes

**Marking for batch implementation with other Individual Portal docs.**
