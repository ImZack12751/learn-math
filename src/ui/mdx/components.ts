import { PowerLadder } from '../diagrams/PowerLadder';
import { Tex } from '../math/Tex';
import {
  Callout,
  Claim,
  Explanation,
  Misconception,
  NextUp,
  Prereq,
  Prose,
  Section,
  Takeaways,
  Term,
  WhyItMatters,
} from './Blocks';
import { CheckYourself } from './CheckYourself';
import { Practice } from './Practice';
import { WorkedExample, WorkedExamples } from './WorkedExamples';

/** Everything a lesson's MDX may use, by name (lessons import nothing themselves). */
export const mdxComponents = {
  Tex,
  WhyItMatters,
  Explanation,
  Section,
  Prose,
  Callout,
  Term,
  Prereq,
  Claim,
  Misconception,
  WorkedExamples,
  WorkedExample,
  Practice,
  Takeaways,
  NextUp,
  CheckYourself,
  PowerLadder,
};
