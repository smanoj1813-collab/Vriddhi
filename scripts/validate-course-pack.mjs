#!/usr/bin/env node
// scripts/validate-course-pack.mjs
//
// Structural checks for the course packs under content/courses/<id>/ so a
// broken manifest or a missing lesson fails in CI rather than in a learner's
// browser. Complements validateManifest() in src/shared/courses/courseModel.ts
// (which is also run here, via tsx) with filesystem and quiz-bank checks:
//
//   • every topic's lesson path and every document/blueprint path exists
//   • each lesson begins with "# <number> <title>" and has the standard sections
//   • per-module quiz.json: moduleId and manifest-declared lesson counts match,
//     ids/options/answers/explanations are valid, project topics have no bank,
//     and declared module assessments have the required advanced question bank
//   • no stray lesson files that the manifest does not reference
//
// Usage: node scripts/validate-course-pack.mjs [--pack <id>] [--quiet]
// Exit code 1 on any problem.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tsImport } from 'tsx/esm/api'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const COURSES_DIR = join(ROOT, 'content', 'courses')
const DEFAULT_QUIZ_PER_LESSON = 5
const REQUIRED_SECTIONS = [
  '## Learning objectives',
  '## Core ideas',
  '## Hands-on lab',
  '## Key takeaways',
  '## Reflection journal',
]
const REQUIRED_PROJECT_SECTIONS = ['## The brief', '## What to submit', '## Rubric']

const args = process.argv.slice(2)
const quiet = args.includes('--quiet')
const packArgIdx = args.indexOf('--pack')
const onlyPack = packArgIdx >= 0 ? args[packArgIdx + 1] : null

// Load the shared TS helpers through tsx so the script and the app agree.
const { validateManifest, flattenTopics } = await tsImport(
  pathToFileURL(join(ROOT, 'src', 'shared', 'courses', 'courseModel.ts')).href,
  import.meta.url,
)

const problems = []
const notes = []
const fail = (pack, msg) => problems.push(`[${pack}] ${msg}`)

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function walkMarkdown(dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walkMarkdown(full))
    else if (entry.endsWith('.md')) out.push(full)
  }
  return out
}

function checkLesson(packId, packDir, topic) {
  const path = join(packDir, topic.lesson)
  if (!existsSync(path)) {
    fail(packId, `topic ${topic.id}: lesson file missing → ${topic.lesson}`)
    return
  }
  const text = readFileSync(path, 'utf8')
  const firstLine = text.split('\n').find((l) => l.trim().length > 0) || ''
  if (!firstLine.startsWith('# ')) {
    fail(packId, `topic ${topic.id}: ${topic.lesson} must start with an H1`)
  } else if (topic.type === 'lesson' && !firstLine.startsWith(`# ${topic.number} `)) {
    fail(packId, `topic ${topic.id}: H1 should begin "# ${topic.number} " (found "${firstLine.slice(0, 40)}")`)
  }
  const required = topic.type === 'project' ? REQUIRED_PROJECT_SECTIONS : REQUIRED_SECTIONS
  for (const section of required) {
    if (!text.includes(section)) fail(packId, `topic ${topic.id}: ${topic.lesson} lacks "${section}"`)
  }
  if (topic.type === 'lesson') {
    const planMatch = text.match(/\*\*Lesson plan\*\*\s*·\s*(\d+)\s*minutes/)
    if (!planMatch) fail(packId, `topic ${topic.id}: ${topic.lesson} lacks a "**Lesson plan** · N minutes" line`)
    else if (Number(planMatch[1]) !== topic.minutes) {
      fail(packId, `topic ${topic.id}: lesson plan says ${planMatch[1]} min but manifest says ${topic.minutes}`)
    }
    const words = text.split(/\s+/).filter(Boolean).length
    if (words < 900) fail(packId, `topic ${topic.id}: ${topic.lesson} is only ${words} words (expected a full lesson ≥ 900)`)
  }
  if (/<\s*(script|iframe|img|div|span)\b/i.test(text)) {
    fail(packId, `topic ${topic.id}: ${topic.lesson} contains raw HTML, which the renderer does not support`)
  }
}

function checkQuestionList(packId, mod, questions, { idPrefix, seenIds, seenText, requireAdvanced = false }) {
  if (!Array.isArray(questions)) {
    fail(packId, `module ${mod.id}: ${idPrefix} questions must be an array`)
    return 0
  }
  questions.forEach((q, i) => {
    const fallbackId = `${idPrefix}-q${i + 1}`
    const expectedId = fallbackId
    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      fail(packId, `${fallbackId}: question must be an object`)
      return
    }
    const id = typeof q.id === 'string' ? q.id : ''
    if (id !== expectedId) fail(packId, `${id || fallbackId}: id should be "${expectedId}" (found "${q.id}")`)
    if (seenIds.has(id)) fail(packId, `duplicate question id "${id}"`)
    seenIds.add(id)
    if (typeof q.question !== 'string' || q.question.trim().length < 10) fail(packId, `${id || fallbackId}: question text too short`)
    else {
      const normalised = q.question.trim().toLowerCase().replace(/\s+/g, ' ')
      if (seenText.has(normalised)) fail(packId, `${id}: duplicate question text`)
      seenText.add(normalised)
    }
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((option) => typeof option !== 'string' || !option.trim())) {
      fail(packId, `${id || fallbackId}: expected 4 non-empty text options`)
    } else if (new Set(q.options.map((option) => option.trim().toLowerCase())).size !== 4) {
      fail(packId, `${id || fallbackId}: duplicate options`)
    }
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= (q.options?.length || 0)) {
      fail(packId, `${id || fallbackId}: answerIndex ${q.answerIndex} out of range`)
    }
    if (typeof q.explanation !== 'string' || !q.explanation.trim()) fail(packId, `${id || fallbackId}: missing explanation`)
    if (q.difficulty !== undefined && !['core', 'advanced'].includes(q.difficulty)) {
      fail(packId, `${id || fallbackId}: difficulty must be "core" or "advanced"`)
    }
    if (requireAdvanced && q.difficulty !== 'advanced') {
      fail(packId, `${id || fallbackId}: module assessment questions must be marked advanced`)
    }
  })
  return questions.length
}

function checkQuizBank(packId, packDir, mod, expectedLessonCount) {
  const bankPath = join(packDir, 'modules', mod.slug, 'quiz.json')
  if (!existsSync(bankPath)) {
    fail(packId, `module ${mod.id}: quiz bank missing → modules/${mod.slug}/quiz.json`)
    return 0
  }
  let bank
  try {
    bank = readJson(bankPath)
  } catch (err) {
    fail(packId, `module ${mod.id}: quiz.json is not valid JSON (${err.message})`)
    return 0
  }
  if (bank.moduleId !== mod.id) fail(packId, `module ${mod.id}: quiz.json moduleId is "${bank.moduleId}"`)
  const seenIds = new Set()
  const seenText = new Set()
  let count = 0
  const topicIds = new Set(mod.topics.map((t) => t.id))
  const bankQuestions = bank.questions && typeof bank.questions === 'object' && !Array.isArray(bank.questions)
    ? bank.questions
    : {}
  if (!bank.questions || typeof bank.questions !== 'object' || Array.isArray(bank.questions)) {
    fail(packId, `module ${mod.id}: quiz.json questions must be an object keyed by topic id`)
  }
  for (const topicId of Object.keys(bankQuestions)) {
    if (!topicIds.has(topicId)) fail(packId, `module ${mod.id}: quiz bank has questions for unknown topic "${topicId}"`)
  }
  for (const topic of mod.topics) {
    const questions = bankQuestions[topic.id]
    if (topic.type === 'project') {
      if (questions && questions.length) fail(packId, `topic ${topic.id}: project topics should not carry a quiz bank`)
      continue
    }
    if (!Array.isArray(questions)) {
      fail(packId, `topic ${topic.id}: no quiz questions in ${mod.slug}/quiz.json`)
      continue
    }
    if (questions.length !== expectedLessonCount) {
      fail(packId, `topic ${topic.id}: expected ${expectedLessonCount} questions, found ${questions.length}`)
    }
    count += checkQuestionList(packId, mod, questions, {
      idPrefix: topic.id,
      seenIds,
      seenText,
    })
  }

  if (mod.assessment) {
    const assessment = bank.moduleAssessment
    if (!assessment || !Array.isArray(assessment.questions)) {
      fail(packId, `module ${mod.id}: moduleAssessment bank is required`)
    } else {
      if (assessment.title !== mod.assessment.title) {
        fail(packId, `module ${mod.id}: assessment bank title should be "${mod.assessment.title}"`)
      }
      if (assessment.questions.length !== mod.assessment.questionCount) {
        fail(packId, `module ${mod.id}: expected ${mod.assessment.questionCount} module assessment questions, found ${assessment.questions.length}`)
      }
      count += checkQuestionList(packId, mod, assessment.questions, {
        idPrefix: `${mod.id}-assessment`,
        seenIds,
        seenText,
        requireAdvanced: true,
      })
    }
  } else if (bank.moduleAssessment) {
    fail(packId, `module ${mod.id}: quiz bank has moduleAssessment but manifest does not declare one`)
  }
  return count
}

function checkSlides(packId, packDir, mod) {
  const slidesPath = join(packDir, 'modules', mod.slug, 'slides.json')
  if (!existsSync(slidesPath)) return 0

  let bank
  try {
    bank = readJson(slidesPath)
  } catch (err) {
    fail(packId, `module ${mod.id}: slides.json is not valid JSON (${err.message})`)
    return 0
  }
  if (bank.moduleId !== mod.id) fail(packId, `module ${mod.id}: slides.json moduleId is "${bank.moduleId}"`)
  if (!bank.topics || typeof bank.topics !== 'object' || Array.isArray(bank.topics)) {
    fail(packId, `module ${mod.id}: slides.json topics must be an object keyed by topic id`)
    return 0
  }

  const topicIds = new Set(mod.topics.map((topic) => topic.id))
  const slideIds = new Set()
  let count = 0
  for (const [topicId, slides] of Object.entries(bank.topics)) {
    if (!topicIds.has(topicId)) fail(packId, `module ${mod.id}: slides bank has an unknown topic "${topicId}"`)
    if (!Array.isArray(slides) || slides.length === 0) {
      fail(packId, `topic ${topicId}: slide deck must be a non-empty array`)
      continue
    }
    count += slides.length
    slides.forEach((slide, index) => {
      const fallbackId = `${topicId}-s${index + 1}`
      if (!slide || typeof slide !== 'object' || Array.isArray(slide)) {
        fail(packId, `${fallbackId}: slide must be an object`)
        return
      }
      if (typeof slide.id !== 'string' || !slide.id.trim()) {
        fail(packId, `${fallbackId}: missing slide id`)
      } else if (slideIds.has(slide.id)) {
        fail(packId, `duplicate slide id "${slide.id}"`)
      } else {
        slideIds.add(slide.id)
      }
      for (const field of ['title', 'summary', 'explanation', 'takeaway']) {
        if (typeof slide[field] !== 'string' || !slide[field].trim()) {
          fail(packId, `${slide.id || fallbackId}: missing slide ${field}`)
        }
      }
      if (slide.example !== undefined && (typeof slide.example !== 'string' || !slide.example.trim())) {
        fail(packId, `${slide.id || fallbackId}: example must be non-empty text when provided`)
      }
      if (slide.visual !== undefined) {
        if (!slide.visual || typeof slide.visual !== 'object' || Array.isArray(slide.visual)) {
          fail(packId, `${slide.id || fallbackId}: visual must be an object`)
          return
        }
        if (!['cards', 'compare', 'flow'].includes(slide.visual.kind)) {
          fail(packId, `${slide.id || fallbackId}: visual kind must be cards, compare, or flow`)
        }
        if (!Array.isArray(slide.visual.items) || slide.visual.items.length < 2 || slide.visual.items.length > 4) {
          fail(packId, `${slide.id || fallbackId}: visual must have 2–4 items`)
        } else {
          slide.visual.items.forEach((item, itemIndex) => {
            if (!item || typeof item !== 'object' || Array.isArray(item) ||
              typeof item.title !== 'string' || !item.title.trim() ||
              typeof item.detail !== 'string' || !item.detail.trim()) {
              fail(packId, `${slide.id || fallbackId}: visual item ${itemIndex + 1} needs a title and detail`)
            }
          })
        }
      }
    })
  }
  return count
}

function checkPack(packId) {
  const packDir = join(COURSES_DIR, packId)
  const manifestPath = join(packDir, 'course.json')
  if (!existsSync(manifestPath)) {
    fail(packId, 'course.json missing')
    return
  }
  let manifest
  try {
    manifest = readJson(manifestPath)
  } catch (err) {
    fail(packId, `course.json is not valid JSON (${err.message})`)
    return
  }
  if (manifest.id !== packId) fail(packId, `manifest.id "${manifest.id}" does not match folder name`)
  for (const p of validateManifest(manifest)) fail(packId, p)

  const topics = flattenTopics(manifest)
  const referenced = new Set()
  for (const topic of topics) {
    referenced.add(resolve(packDir, topic.lesson))
    checkLesson(packId, packDir, topic)
  }

  const expectedLessonCount = Number.isInteger(manifest.lessonQuizQuestionCount) && manifest.lessonQuizQuestionCount > 0
    ? manifest.lessonQuizQuestionCount
    : DEFAULT_QUIZ_PER_LESSON
  let quizCount = 0
  let slideCount = 0
  for (const mod of manifest.modules) {
    quizCount += checkQuizBank(packId, packDir, mod, expectedLessonCount)
    slideCount += checkSlides(packId, packDir, mod)
  }

  const docPaths = [
    ...Object.values(manifest.documents || {}),
    manifest.finalAssessment?.blueprint,
  ].filter(Boolean)
  for (const doc of docPaths) {
    const full = join(packDir, doc)
    referenced.add(resolve(full))
    if (!existsSync(full)) fail(packId, `document missing → ${doc}`)
  }

  // Stray lesson files the manifest never references (README is allowed).
  for (const file of walkMarkdown(join(packDir, 'modules')).concat(walkMarkdown(join(packDir, 'projects')))) {
    if (!referenced.has(resolve(file))) fail(packId, `unreferenced markdown file: ${relative(packDir, file)}`)
  }

  const lessonCount = topics.filter((t) => t.type === 'lesson').length
  const projectCount = topics.length - lessonCount
  const minutes = topics.reduce((n, t) => n + t.minutes, 0)
  notes.push(
    `${packId}: ${manifest.modules.length} modules · ${lessonCount} lessons · ${projectCount} projects · ` +
      `${quizCount} quiz items · ${slideCount} slides · ${(minutes / 60).toFixed(1)} h of topics vs ${manifest.totalHours} h declared`,
  )
}

if (!existsSync(COURSES_DIR)) {
  console.error(`No course packs directory at ${COURSES_DIR}`)
  process.exit(1)
}

const packs = readdirSync(COURSES_DIR).filter((d) => {
  const full = join(COURSES_DIR, d)
  return statSync(full).isDirectory() && (!onlyPack || d === onlyPack)
})
if (packs.length === 0) {
  console.error(onlyPack ? `Pack "${onlyPack}" not found` : 'No course packs found')
  process.exit(1)
}
for (const pack of packs) checkPack(pack)

if (!quiet) for (const n of notes) console.log(`✔ ${n}`)
if (problems.length) {
  console.error(`\n✖ ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(`✔ ${packs.length} course pack(s) valid`)
