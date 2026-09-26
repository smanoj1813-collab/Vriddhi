// functions/test/aiChatQuota.test.ts
//
// Decision D2: the AI chat is the largest and only unbounded AI cost line, so a
// student gets a daily turn budget. These tests pin the boundary behaviour —
// the number itself is an operator setting, but "who is capped", "what happens
// at the limit" and "how to switch it off" must not drift.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_CHAT_DAILY_TURNS,
  chatDailyTurnLimit,
  chatQuotaApplies,
  chatQuotaDocId,
  chatQuotaExceededBody,
  chatQuotaState,
} from '../src/aiChatQuota'

const NO_ENV = {} as NodeJS.ProcessEnv

describe('chat daily turn limit', () => {
  it('defaults to twenty turns', () => {
    assert.equal(chatDailyTurnLimit(NO_ENV), DEFAULT_CHAT_DAILY_TURNS)
    assert.equal(DEFAULT_CHAT_DAILY_TURNS, 20)
  })

  it('reads the operator override, including the switch-off value', () => {
    assert.equal(chatDailyTurnLimit({ AI_CHAT_DAILY_TURNS: '50' } as NodeJS.ProcessEnv), 50)
    assert.equal(chatDailyTurnLimit({ AI_CHAT_DAILY_TURNS: '0' } as NodeJS.ProcessEnv), 0)
  })

  it('ignores nonsense rather than disabling the cap by accident', () => {
    assert.equal(chatDailyTurnLimit({ AI_CHAT_DAILY_TURNS: 'lots' } as NodeJS.ProcessEnv), DEFAULT_CHAT_DAILY_TURNS)
    assert.equal(chatDailyTurnLimit({ AI_CHAT_DAILY_TURNS: '-5' } as NodeJS.ProcessEnv), DEFAULT_CHAT_DAILY_TURNS)
    assert.equal(chatDailyTurnLimit({ AI_CHAT_DAILY_TURNS: '  ' } as NodeJS.ProcessEnv), DEFAULT_CHAT_DAILY_TURNS)
  })
})

describe('who the cap applies to', () => {
  it('caps students and uncapped legacy roles, exempts staff', () => {
    assert.equal(chatQuotaApplies('student', NO_ENV), true)
    assert.equal(chatQuotaApplies(undefined, NO_ENV), true)
    assert.equal(chatQuotaApplies('faculty', NO_ENV), false)
    assert.equal(chatQuotaApplies('hod', NO_ENV), false)
    assert.equal(chatQuotaApplies('admin', NO_ENV), false)
    assert.equal(chatQuotaApplies('superadmin', NO_ENV), false)
    assert.equal(chatQuotaApplies('accounts', NO_ENV), false)
  })

  it('applies to nobody when the limit is switched off', () => {
    const env = { AI_CHAT_DAILY_TURNS: '0' } as NodeJS.ProcessEnv
    assert.equal(chatQuotaApplies('student', env), false)
  })
})

describe('quota state', () => {
  it('counts down and trips exactly at the limit', () => {
    const env = { AI_CHAT_DAILY_TURNS: '3' } as NodeJS.ProcessEnv
    assert.deepEqual(chatQuotaState(undefined, 'student', env), {
      turns: 0,
      limit: 3,
      remaining: 3,
      exceeded: false,
      unlimited: false,
    })
    assert.equal(chatQuotaState({ turns: 2 }, 'student', env).exceeded, false)
    assert.equal(chatQuotaState({ turns: 2 }, 'student', env).remaining, 1)
    assert.equal(chatQuotaState({ turns: 3 }, 'student', env).exceeded, true)
    assert.equal(chatQuotaState({ turns: 4 }, 'student', env).exceeded, true)
  })

  it('never reports a negative remaining count', () => {
    const env = { AI_CHAT_DAILY_TURNS: '2' } as NodeJS.ProcessEnv
    assert.equal(chatQuotaState({ turns: 99 }, 'student', env).remaining, 0)
  })

  it('treats a corrupt counter as zero rather than as unlimited', () => {
    const env = { AI_CHAT_DAILY_TURNS: '5' } as NodeJS.ProcessEnv
    assert.equal(chatQuotaState({ turns: 'many' }, 'student', env).turns, 0)
    assert.equal(chatQuotaState({ turns: -3 }, 'student', env).turns, 0)
  })

  it('is unlimited for staff and when the cap is off', () => {
    const staff = chatQuotaState({ turns: 900 }, 'faculty', NO_ENV)
    assert.equal(staff.exceeded, false)
    assert.equal(staff.unlimited, true)
    const off = chatQuotaState({ turns: 900 }, 'student', { AI_CHAT_DAILY_TURNS: '0' } as NodeJS.ProcessEnv)
    assert.equal(off.exceeded, false)
    assert.equal(off.unlimited, true)
  })
})

describe('the 429 body', () => {
  it('tells the student what happened and what still works', () => {
    const body = chatQuotaExceededBody({ turns: 20, limit: 20, remaining: 0, exceeded: true, unlimited: false })
    assert.equal(body.error, 'chat_quota_exceeded')
    assert.equal(body.limit, 20)
    assert.match(String(body.message), /20 AI assistant messages/)
    assert.match(String(body.message), /resets at midnight/)
  })
})

describe('quota document id', () => {
  it('is one document per user per day', () => {
    assert.equal(chatQuotaDocId('uid-1', '2026-09-25'), 'uid-1_2026-09-25')
    assert.notEqual(chatQuotaDocId('uid-1', '2026-09-25'), chatQuotaDocId('uid-1', '2026-09-26'))
  })
})
