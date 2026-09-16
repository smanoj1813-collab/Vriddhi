import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractCanonicalSubject,
  extractCanonicalTopic,
  isSameSubject,
  isSameTopic,
} from './curriculumMatcher';

describe('curriculumMatcher', () => {
  describe('extractCanonicalSubject', () => {
    it('strips UOM course code prefixes like BBA 3.1', () => {
      assert.equal(
        extractCanonicalSubject('BBA 3.1 — Cost Accounting'),
        'cost accounting'
      );
    });

    it('strips B.Com numbering prefixes', () => {
      assert.equal(
        extractCanonicalSubject('B.Com 1.1: Financial Accounting'),
        'financial accounting'
      );
    });

    it('strips generic code patterns like COM 302', () => {
      assert.equal(
        extractCanonicalSubject('COM 302 - Advanced Corporate Accounting'),
        'advanced corporate accounting'
      );
    });

    it('handles engineering paper codes like 21CS32', () => {
      assert.equal(
        extractCanonicalSubject('21CS32 - Data Structures and Applications'),
        'data structures and applications'
      );
    });

    it('handles empty or null gracefully', () => {
      assert.equal(extractCanonicalSubject(null), '');
      assert.equal(extractCanonicalSubject(undefined), '');
      assert.equal(extractCanonicalSubject(''), '');
    });
  });

  describe('extractCanonicalTopic', () => {
    it('strips Unit numbers and colons', () => {
      assert.equal(
        extractCanonicalTopic('Unit 3: Marginal Costing & BEP'),
        'marginal costing bep'
      );
    });

    it('strips Module roman numerals', () => {
      assert.equal(
        extractCanonicalTopic('Module II - Capital Budgeting'),
        'capital budgeting'
      );
    });

    it('strips trailing hours or marks indicators', () => {
      assert.equal(
        extractCanonicalTopic('Unit 1: Introduction to Costing (12 Hours)'),
        'introduction to costing'
      );
    });
  });

  describe('isSameSubject', () => {
    it('matches identical subjects with different university codes', () => {
      const uomCode = 'BBA 3.1 — Cost Accounting';
      const buCode = 'BBA 302: Cost Accounting';
      assert.equal(isSameSubject(uomCode, buCode), true);
    });

    it('matches full subject with partial subject', () => {
      assert.equal(
        isSameSubject('Principles of Cost Accounting', 'Cost Accounting'),
        true
      );
    });

    it('does not match unrelated subjects', () => {
      assert.equal(
        isSameSubject('Financial Accounting', 'Business Law'),
        false
      );
    });
  });

  describe('isSameTopic', () => {
    it('matches topics with different unit numbering', () => {
      const topic1 = 'Unit 3: Marginal Costing';
      const topic2 = 'Module IV: Marginal Costing';
      assert.equal(isSameTopic(topic1, topic2), true);
    });

    it('does not match unrelated topics', () => {
      assert.equal(
        isSameTopic('Process Costing', 'Ratio Analysis'),
        false
      );
    });
  });
});
