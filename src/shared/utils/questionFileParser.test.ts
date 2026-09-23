// src/shared/utils/questionFileParser.test.ts
//
// Run with: npm run test:unit   (node --import ./scripts/raw-asset-hooks.mjs --import tsx --test)
//
// The shared upload parser is header-driven, so a new column in the platform
// question-bank CSVs is only preserved if it is declared in HEADER_ALIASES —
// an unmapped header is skipped outright, not stored. These tests pin the
// `subtopic` tier (subject → topic → sub-topic) and prove that a CSV written
// before the column existed still parses with every other column in place.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SAMPLE_QUESTION_CSV,
  emptyDraftQuestion,
  parseDelimitedQuestions,
  parseJsonQuestions,
  parseQuestionFile,
} from './questionFileParser';

const HEADER =
  'text,subject,type,difficulty,unit,subtopic,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName';

describe('questionFileParser sub-topic column', () => {
  it('reads the subtopic column into its own field', () => {
    const { questions } = parseDelimitedQuestions(
      [
        HEADER,
        'The accounting equation is stated as:,Financial Accounting,mcq,easy,Journal and Accounting Equation,Accounting Equation and Dual Aspect,1,A|B|C|D,A,Because assets equal claims.,financial,2026-27,B.Com,false,,',
      ].join('\n')
    );
    assert.equal(questions.length, 1);
    assert.equal(questions[0].unit, 'Journal and Accounting Equation');
    assert.equal(questions[0].subtopic, 'Accounting Equation and Dual Aspect');
    assert.equal(questions[0].marks, 1, 'columns after subtopic must not shift');
    assert.deepEqual(questions[0].options, ['A', 'B', 'C', 'D']);
    assert.equal(questions[0].branch, 'B.Com');
  });

  it('accepts the common spellings of the header', () => {
    for (const spelling of ['subtopic', 'SubTopic', 'Sub-topic', 'sub topic', 'subTopicId']) {
      const header = HEADER.replace('subtopic', spelling);
      const { questions } = parseDelimitedQuestions(
        [header, 'Q:,Economics,short_answer,medium,Demand,Law of Demand,2,,Answer,,econ,2026-27,BA,false,,'].join('\n')
      );
      assert.equal(questions[0].subtopic, 'Law of Demand', `header spelling ${spelling}`);
    }
  });

  it('parses a CSV written before the column existed without shifting anything', () => {
    const legacy = [
      'text,subject,type,difficulty,unit,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName',
      'Old question:,Economics,short_answer,medium,Demand,2,,Answer text,,econ,2026-27,BA,false,,',
    ].join('\n');
    const { questions } = parseDelimitedQuestions(legacy);
    assert.equal(questions.length, 1);
    assert.equal(questions[0].subtopic, '');
    assert.equal(questions[0].unit, 'Demand');
    assert.equal(questions[0].marks, 2);
    assert.equal(questions[0].correctAnswer, 'Answer text');
    assert.equal(questions[0].branch, 'BA');
  });

  it('reads subtopic out of a JSON upload too', () => {
    const { questions } = parseJsonQuestions(
      JSON.stringify([
        { text: 'Q1', subject: 'History', unit: 'Medieval India', subtopic: 'Delhi Sultanate', marks: 2 },
        { text: 'Q2', subject: 'History', unit: 'Medieval India', subTopicId: 'Mughal Empire and Administration' },
        { text: 'Q3', subject: 'History' },
      ])
    );
    assert.equal(questions.length, 3);
    assert.equal(questions[0].subtopic, 'Delhi Sultanate');
    assert.equal(questions[1].subtopic, 'Mughal Empire and Administration');
    assert.equal(questions[2].subtopic, '');
  });

  it('routes .csv and .json through the right parser and keeps the tier', () => {
    const csv = parseQuestionFile(
      'BCom_QuestionBank.csv',
      [HEADER, 'Q:,Financial Accounting,mcq,easy,Financial Statements,Balance Sheet Classification,1,A|B|C|D,B,,financial,2026-27,B.Com,false,,'].join('\n')
    );
    assert.equal(csv.questions[0].subtopic, 'Balance Sheet Classification');

    const json = parseQuestionFile(
      'questions.json',
      JSON.stringify({ questions: [{ text: 'Q:', subject: 'Economics', subtopic: 'Law of Demand' }] })
    );
    assert.equal(json.questions[0].subtopic, 'Law of Demand');
  });

  it('defaults a new draft to an empty sub-topic so spreads never inject undefined', () => {
    assert.equal(emptyDraftQuestion().subtopic, '');
    assert.equal(emptyDraftQuestion({ subtopic: 'Time Series' }).subtopic, 'Time Series');
  });

  it('the downloadable sample teaches the column', () => {
    const lines = SAMPLE_QUESTION_CSV.split('\n');
    assert.equal(lines[0].split(',').indexOf('subtopic'), 5, 'subtopic sits right after unit');
    const { questions } = parseDelimitedQuestions(SAMPLE_QUESTION_CSV);
    assert.equal(questions.length, 3);
    for (const q of questions) {
      assert.ok(q.subtopic.trim().length > 0, `sample row lost its sub-topic: ${q.text}`);
      assert.ok(!q.subtopic.includes(','), 'the sample must obey the raw-comma rule');
    }
  });
});
