import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { getTopic } from './curriculum';
import { glossary } from './glossary';

describe('glossary', () => {
  it.each(Object.entries(glossary))(
    '%s is taught in a real topic and its example renders',
    (_id, entry) => {
      expect(getTopic(entry.firstTaughtIn), entry.firstTaughtIn).toBeDefined();
      expect(entry.definition.length).toBeGreaterThan(20);
      if ('example' in entry) {
        expect(() =>
          katex.renderToString(entry.example, { throwOnError: true, strict: 'error' }),
        ).not.toThrow();
      }
    },
  );
});
