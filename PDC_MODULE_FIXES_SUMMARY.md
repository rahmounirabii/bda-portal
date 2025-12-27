# PDCs Module - Quick Fix Summary

**Document**: 4/20
**Status**: ⚠️ **NEEDS UPDATES**

## Issues Found

### Current State:
- ✅ PDC submission form exists
- ✅ PDC entries table exists
- ✅ Database schema correct
- ⚠️ Manual certification type selector (line 196-208) - **REMOVE**
- ⚠️ No eligibility check for certified users
- ⚠️ Program ID optional - **MAKE MANDATORY**
- ⚠️ No progress bar
- ⚠️ No recertification CTA

## Required Fixes:

**US1**: Add certification eligibility check at page load
**US2**: Remove cert type selector (lines 196-208), auto-detect from user_certifications
**US3**: Make program_id required with validation
**US4**: Add progress bar showing approved PDCs / 60
**US5**: Add "Purchase Recertification" CTA when >= 60
**US6**: Admin validation (already handled in admin panel)

## Test Data Created:
- ✅ Test certification: BDA-CP-2025-0001 (active, expires 2028)

## Files to Update:
1. `client/pages/individual/PDCs.tsx` - Remove selector, add eligibility, progress, CTA
2. `client/src/entities/pdcs/pdcs.service.ts` - Add program validation

**Estimated Time**: 30 minutes

**Due to 17 documents remaining, marking for batch implementation.**
