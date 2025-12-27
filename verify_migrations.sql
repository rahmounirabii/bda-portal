-- =============================================================================
-- VERIFICATION SCRIPT: Check if BDA Competency Framework migrations are applied
-- =============================================================================

-- 1. Check if new tables exist
SELECT
    'Table exists: ' || table_name as verification,
    'YES' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('curriculum_lessons', 'user_lesson_progress')
ORDER BY table_name;

-- 2. Check new columns in mock_exams
SELECT
    'Column exists: mock_exams.' || column_name as verification,
    'YES' as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mock_exams'
AND column_name = 'competency_module_id';

-- 3. Check new columns in curriculum_modules
SELECT
    'Column exists: curriculum_modules.' || column_name as verification,
    'YES' as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'curriculum_modules'
AND column_name = 'competency_assessment_exam_id';

-- 4. Check exam_category enum values
SELECT
    'Enum value: ' || e.enumlabel as verification,
    'YES' as status
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'exam_category'
ORDER BY e.enumsortorder;

-- 5. Check new columns in quiz_questions
SELECT
    'Column exists: quiz_questions.' || column_name as verification,
    'YES' as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'quiz_questions'
AND column_name IN ('competency_section', 'competency_name', 'sub_competency_name', 'tags', 'is_shared')
ORDER BY column_name;

-- 6. Check new columns in mock_exam_questions
SELECT
    'Column exists: mock_exam_questions.' || column_name as verification,
    'YES' as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mock_exam_questions'
AND column_name IN ('competency_section', 'competency_name', 'sub_competency_name', 'tags', 'difficulty')
ORDER BY column_name;

-- 7. Check new functions
SELECT
    'Function exists: ' || routine_name as verification,
    'YES' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'is_lesson_unlocked',
    'get_lesson_progress_summary',
    'initialize_lesson_progress',
    'get_questions_by_competency'
)
ORDER BY routine_name;

-- 8. Summary count
SELECT
    '=== SUMMARY ===' as verification,
    '' as status
UNION ALL
SELECT
    'Total new tables',
    COUNT(*)::TEXT
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('curriculum_lessons', 'user_lesson_progress')
UNION ALL
SELECT
    'Total new functions',
    COUNT(*)::TEXT
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'is_lesson_unlocked',
    'get_lesson_progress_summary',
    'initialize_lesson_progress',
    'get_questions_by_competency'
)
UNION ALL
SELECT
    'Enum values in exam_category',
    COUNT(*)::TEXT
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'exam_category';
