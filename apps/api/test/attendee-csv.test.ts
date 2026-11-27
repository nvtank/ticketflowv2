import type * as Csv from '../src/events/attendee-csv';
import { createRequire } from 'node:module';
import { expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { csvRow } = require('../dist/events/attendee-csv.js') as typeof Csv;

it('quotes commas, quotes, newlines, empty cells and Vietnamese text', () => {
  expect(csvRow(['Nguyễn, "An"', 'Phạm\r\nLinh', '', 'VIP'])).toBe(
    '"Nguyễn, ""An""","Phạm\r\nLinh","","VIP"\r\n',
  );
});

it.each(['=1+1', '+1', '-1', '@A1', '  =1+1', '\t=1+1', '\rname', '\nname', '＝1+1'])(
  'forces a formula-like field to text: %j',
  (field) => {
    expect(csvRow([field])).toBe(`"'${field}"\r\n`);
  },
);
