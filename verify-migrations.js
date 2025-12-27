#!/usr/bin/env node

/**
 * Verification Script: Check if BDA Competency Framework migrations are applied
 *
 * Usage: node verify-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dfsbzsxuursvqwnzruqt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function verifyMigrations() {
  console.log('\n🔍 Verifying BDA Competency Framework Migrations...\n');

  // 1. Check if curriculum_lessons table exists
  console.log('📋 Checking Tables...');
  const { data: lessons, error: lessonsError } = await supabase
    .from('curriculum_lessons')
    .select('id')
    .limit(1);

  if (lessonsError) {
    if (lessonsError.code === '42P01') {
      console.log('  ❌ curriculum_lessons - NOT FOUND');
    } else {
      console.log('  ❌ curriculum_lessons - ERROR:', lessonsError.message);
    }
  } else {
    console.log('  ✅ curriculum_lessons - EXISTS');
  }

  // 2. Check if user_lesson_progress table exists
  const { data: progress, error: progressError } = await supabase
    .from('user_lesson_progress')
    .select('id')
    .limit(1);

  if (progressError) {
    if (progressError.code === '42P01') {
      console.log('  ❌ user_lesson_progress - NOT FOUND');
    } else {
      console.log('  ❌ user_lesson_progress - ERROR:', progressError.message);
    }
  } else {
    console.log('  ✅ user_lesson_progress - EXISTS');
  }

  // 3. Check if mock_exams has competency_module_id column
  console.log('\n📋 Checking Columns...');
  const { data: mockExams, error: mockError } = await supabase
    .from('mock_exams')
    .select('competency_module_id')
    .limit(1);

  if (mockError) {
    console.log('  ❌ mock_exams.competency_module_id - ERROR:', mockError.message);
  } else {
    console.log('  ✅ mock_exams.competency_module_id - EXISTS');
  }

  // 4. Check if curriculum_modules has competency_assessment_exam_id column
  const { data: modules, error: modulesError } = await supabase
    .from('curriculum_modules')
    .select('competency_assessment_exam_id')
    .limit(1);

  if (modulesError) {
    console.log('  ❌ curriculum_modules.competency_assessment_exam_id - ERROR:', modulesError.message);
  } else {
    console.log('  ✅ curriculum_modules.competency_assessment_exam_id - EXISTS');
  }

  // 5. Check if quiz_questions has competency tagging columns
  const { data: quizQuestions, error: quizError } = await supabase
    .from('quiz_questions')
    .select('competency_section, competency_name, sub_competency_name, tags, is_shared')
    .limit(1);

  if (quizError) {
    console.log('  ❌ quiz_questions tagging columns - ERROR:', quizError.message);
  } else {
    console.log('  ✅ quiz_questions.competency_section - EXISTS');
    console.log('  ✅ quiz_questions.competency_name - EXISTS');
    console.log('  ✅ quiz_questions.sub_competency_name - EXISTS');
    console.log('  ✅ quiz_questions.tags - EXISTS');
    console.log('  ✅ quiz_questions.is_shared - EXISTS');
  }

  // 6. Check if mock_exam_questions has competency tagging columns
  const { data: mockQuestions, error: mockQError } = await supabase
    .from('mock_exam_questions')
    .select('competency_section, competency_name, sub_competency_name, tags, difficulty')
    .limit(1);

  if (mockQError) {
    console.log('  ❌ mock_exam_questions tagging columns - ERROR:', mockQError.message);
  } else {
    console.log('  ✅ mock_exam_questions.competency_section - EXISTS');
    console.log('  ✅ mock_exam_questions.competency_name - EXISTS');
    console.log('  ✅ mock_exam_questions.sub_competency_name - EXISTS');
    console.log('  ✅ mock_exam_questions.tags - EXISTS');
    console.log('  ✅ mock_exam_questions.difficulty - EXISTS');
  }

  // 7. Try to check enum values (this requires RPC call or raw SQL)
  console.log('\n📋 Checking Enum Values...');
  console.log('  ℹ️  exam_category enum values:');
  console.log('     Check TypeScript types: exam_category should include:');
  console.log('     - cp, scp, general (old)');
  console.log('     - pre_assessment, post_assessment, competency_assessment (new)');

  console.log('\n✅ Verification Complete!');
  console.log('\nNext steps:');
  console.log('  1. Check TypeScript types in shared/database.types.ts');
  console.log('  2. Verify enum values in Supabase Studio');
  console.log('  3. Start creating curriculum content!');
}

verifyMigrations().catch(console.error);
