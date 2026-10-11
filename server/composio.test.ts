import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatsFrom, emailItems, eventItems, freeGaps, latestAccounts, parseEvents, pickSlots, profileOf, startOf } from './composio';

const LA = 'America/Los_Angeles';
const sundayBefore = new Date('2026-10-11T19:00:00Z'); // Sun 12:00 PDT, so the coming Monday is Oct 12

const marker = (id: string) => `Coffee chat\n\nsignal-agent:${id}`;
const at = (dateTime: string) => ({ dateTime });

test('calendar events become chats counted from the coming Monday', () => {
  const events = parseEvents({
    items: [
      { summary: 'Lena', description: marker('lena'), start: at('2026-10-16T10:50:00-07:00') },
      { summary: 'Kenji', description: marker('kenji'), start: at('2026-10-22T14:00:00-07:00'), end: at('2026-10-22T14:45:00-07:00') },
      {
        summary: 'Marcus',
        description: marker('marcus'),
        start: at('2026-10-14T10:40:00-07:00'),
        end: at('2026-10-14T11:40:00-07:00'),
        attendees: [{ email: 'marcus@lattice-capital.example' }]
      },
      { summary: 'Saturday', description: marker('dana'), start: at('2026-10-17T10:00:00-07:00') },
      { summary: 'Too far', description: marker('m0'), start: at('2026-11-09T10:00:00-08:00') },
      { summary: 'Before the week', description: marker('tom'), start: at('2026-10-09T10:00:00-07:00') },
      { summary: 'Not ours', description: marker('nobody'), start: at('2026-10-13T10:00:00-07:00') },
      { summary: 'Dentist', description: 'bring forms', start: at('2026-10-13T11:00:00-07:00') },
      { summary: 'All day', description: marker('sofia'), start: { date: '2026-10-13' } }
    ]
  });
  assert.deepEqual(chatsFrom(events, sundayBefore, LA), [
    {
      id: 'marcus',
      person: { name: 'Marcus Oyelaran', role: 'General Partner', org: 'Lattice Capital', kind: 'vc' },
      week: 0, day: 2, start: 10.5, minutes: 60,
      startsAt: '2026-10-14T17:40:00.000Z',
      email: 'marcus@lattice-capital.example'
    },
    {
      id: 'lena',
      person: { name: 'Lena Okafor', role: 'Angel investor', org: 'ex-VP Engineering, Datadog', kind: 'angel' },
      week: 0, day: 4, start: 11, minutes: 30,
      startsAt: '2026-10-16T17:50:00.000Z'
    },
    {
      id: 'kenji',
      person: { name: 'Kenji Morales', role: 'Staff Engineer', org: 'Rampart', kind: 'operator' },
      week: 1, day: 3, start: 14, minutes: 45,
      startsAt: '2026-10-22T21:00:00.000Z'
    }
  ]);
});

test('on a Monday the coming Monday is today', () => {
  const events = parseEvents({ items: [{ description: marker('marcus'), start: at('2026-10-12T09:00:00-07:00') }] });
  const [chat] = chatsFrom(events, new Date('2026-10-12T16:00:00Z'), LA);
  assert.deepEqual([chat.week, chat.day, chat.start], [0, 0, 9]);
});

test('startOf returns the instant the zone shows that slot, across a DST change', () => {
  assert.equal(startOf(1, 2, 10.5, sundayBefore, LA), '2026-10-21T17:30:00.000Z');
  const wednesday = new Date('2026-10-28T19:00:00Z'); // clocks go back Sun Nov 1, so Mon Nov 2 is PST
  assert.equal(startOf(0, 0, 9, wednesday, LA), '2026-11-02T17:00:00.000Z');
});

test('free slots: half-hour starts inside 9-17 weekdays, one per day, at most three', () => {
  const gap = (start: string, end: string) => ({ start: Date.parse(start), end: Date.parse(end) });
  const gaps = [
    gap('2026-10-17T10:00:00Z', '2026-10-17T14:00:00Z'), // Saturday
    gap('2026-10-12T07:30:00Z', '2026-10-12T10:15:00Z'), // Mon: 9:00 is the first start that is inside hours
    gap('2026-10-12T13:00:00Z', '2026-10-12T15:00:00Z'), // Mon again
    gap('2026-10-13T09:10:00Z', '2026-10-13T09:50:00Z'), // Tue: 40 minutes is too short
    gap('2026-10-13T16:00:00Z', '2026-10-13T18:00:00Z'), // Tue: only 16:00 ends by 17:00
    gap('2026-10-14T08:00:00Z', '2026-10-14T12:00:00Z'),
    gap('2026-10-15T09:00:00Z', '2026-10-15T17:00:00Z') // a fourth day is left out
  ];
  assert.deepEqual(pickSlots(gaps, 60, 'UTC'), [
    { start: '2026-10-12T09:00:00.000Z', minutes: 60 },
    { start: '2026-10-13T16:00:00.000Z', minutes: 60 },
    { start: '2026-10-14T09:00:00.000Z', minutes: 60 }
  ]);
});

test('free slots use the wall clock of the calendar zone', () => {
  const gaps = [{ start: Date.parse('2026-10-13T15:15:00Z'), end: Date.parse('2026-10-13T20:00:00Z') }]; // 8:15-13:00 PDT
  assert.deepEqual(pickSlots(gaps, 30, LA), [{ start: '2026-10-13T16:00:00.000Z', minutes: 30 }]);
});

test('busy intervals are turned into the gaps between them', () => {
  const data = {
    calendars: {
      primary: {
        busy: [
          { start: '2026-10-12T10:30:00Z', end: '2026-10-12T12:00:00Z' },
          { start: '2026-10-12T10:00:00Z', end: '2026-10-12T11:00:00Z' }
        ]
      }
    }
  };
  const gaps = freeGaps(data, Date.parse('2026-10-12T09:00:00Z'), Date.parse('2026-10-12T13:00:00Z'));
  assert.deepEqual(gaps.map(g => [new Date(g.start).toISOString(), new Date(g.end).toISOString()]), [
    ['2026-10-12T09:00:00.000Z', '2026-10-12T10:00:00.000Z'],
    ['2026-10-12T12:00:00.000Z', '2026-10-12T13:00:00.000Z']
  ]);
});

test('only the newest account per connector counts and statuses collapse to three', () => {
  const rows = [
    { id: 'ca_1', status: 'ACTIVE', toolkit: { slug: 'gmail' }, createdAt: '2026-10-01T00:00:00Z' },
    { id: 'ca_2', status: 'EXPIRED', toolkit: { slug: 'GMAIL' }, createdAt: '2026-10-05T00:00:00Z' },
    { id: 'ca_3', status: 'INITIATED', toolkit: { slug: 'googlecalendar' }, createdAt: '2026-10-02T00:00:00Z' },
    { id: 'ca_4', status: 'ACTIVE', toolkit: { slug: 'slack' }, createdAt: '2026-10-02T00:00:00Z' }
  ] as const;
  assert.deepEqual(latestAccounts(rows.map(r => ({ ...r }))), [
    { source: 'gmail', id: 'ca_2', status: 'failed' },
    { source: 'google-calendar', id: 'ca_3', status: 'pending' }
  ]);
});

test('emails become subject and snippet items, newest first, text capped at 1000', () => {
  const items = emailItems({
    messages: [
      { subject: 'Older', messageText: 'body text', messageTimestamp: '2026-10-01T08:00:00Z' },
      { subject: 'Intro', preview: 'Hi Ari', messageText: 'long', messageTimestamp: '2026-10-09T10:00:00Z' },
      { subject: 'Long', messageText: 'x'.repeat(2000), messageTimestamp: '2026-10-05T10:00:00Z' },
      {}
    ],
    nextPageToken: null
  });
  assert.deepEqual(items.map(i => [i.title, i.text.length > 20 ? i.text.length : i.text, i.at]), [
    ['Intro', 'Hi Ari', '2026-10-09T10:00:00.000Z'],
    ['Long', 1000, '2026-10-05T10:00:00.000Z'],
    ['Older', 'body text', '2026-10-01T08:00:00.000Z']
  ]);
  assert.equal(items[0].source, 'gmail');
});

test('past calendar events become title and description items', () => {
  const events = parseEvents({
    items: [
      { summary: 'Standup', start: at('2026-10-08T09:00:00-07:00') },
      { summary: 'Investor call', description: 'Series A prep', start: at('2026-10-09T13:00:00-07:00') },
      { description: 'no title' }
    ]
  });
  assert.deepEqual(eventItems(events), [
    { source: 'google-calendar', title: 'Investor call', text: 'Series A prep', at: '2026-10-09T20:00:00.000Z' },
    { source: 'google-calendar', title: 'Standup', text: 'Calendar event: Standup', at: '2026-10-08T16:00:00.000Z' }
  ]);
});

test('a LinkedIn response yields the profile fields it has', () => {
  assert.deepEqual(profileOf({ response_dict: { localizedFirstName: 'Ari', localizedLastName: 'Lee', headline: 'Founder at Intuition' } }), {
    name: 'Ari Lee',
    headline: 'Founder at Intuition'
  });
  assert.deepEqual(profileOf({ name: 'Ari Lee', picture: 'https://example.com/a.png' }), { name: 'Ari Lee' });
  assert.deepEqual(profileOf({}), {});
});
