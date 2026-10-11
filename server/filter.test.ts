import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criteriaBlock } from './filter';

test('criteriaBlock lays out the founder criteria for the decision model', () => {
  const brief = {
    name: 'Ari Kapoor',
    company: 'Tracewell',
    pitch: 'Tracing for agents',
    goals: ['Raise a round'],
    meet: ['Seed investors'],
    skip: ['Recruiters', 'Vendors'],
    context: 'Raising a seed.',
    private: ['Revenue: $1']
  };
  assert.equal(
    criteriaBlock(brief),
    `<criteria>
Founder: Ari Kapoor, Tracewell (Tracing for agents)
Goals:
- Raise a round
Hoping to meet:
- Seed investors
Not a fit:
- Recruiters
- Vendors
Checks (judge the three most relevant to this person):
- Invests at seed
- Devtools or infra thesis
- Technical background
- Runs agents in production
- Can help this quarter
The founder's agent may share:
Raising a seed.
</criteria>`
  );
});
