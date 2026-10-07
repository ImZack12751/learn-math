# Iterate: Content Guide

How to write a topic. Read this before writing or editing any MDX, generator or curriculum entry.
Architecture details are in `ARCHITECTURE.md`.

---

## 1. The learner and the voice

The learner has seen this mathematics before but finds it hard. Every page must work for someone
starting from zero.

- **Start from first principles.** Intuition first, then the rule. Concrete numbers before
  symbols.
- **Skip no steps.** If a step is "obvious", write it anyway, with its reason.
- **Never refer to an idea not yet taught.** If you need it, it must be a prerequisite (and
  linked), or you teach it on the page.
- **Define every term the first time** with `<Term id="...">`. The glossary entry must say where
  it is first taught.
- **Plain language, short sentences.** One idea per sentence. Avoid "clearly", "simply",
  "obviously", "just".
- **Every explanation answers three questions:** What is the rule? Why is it true? Where do people
  go wrong?
- **Tone:** calm, direct, respectful. Talk to the learner as a capable adult revising material.
  No cheerleading, no pressure.

Why this approach: studying worked examples before solving reduces cognitive load and speeds
up learning in algebra (Sweller and Cooper, 1985); gradually fading the worked steps helps the
learner move from studying to solving (Renkl and Atkinson's backward fading); practice testing
and spaced (distributed) practice have the strongest evidence of the common study techniques
(Dunlosky et al., 2013; Cepeda et al., 2006); and mixing problem types (interleaving) improves
mathematics learning compared with blocked practice (Rohrer and Taylor, 2007). Full references
in section 10.

---

## 2. Conventions: IB MYP

Terminology and notation follow IB MYP mathematics usage with British spelling. The official
MYP notation list lives in the subject guide (IB Programme Resource Centre), which could not be
consulted while writing this; items marked † are inferred from IB practice and need confirming.

**Spelling and terms:** factorise, simplify, rationalise, recognise, colour; highest common
factor (HCF), lowest common multiple (LCM); surd; index or exponent (we say "exponent" and define
"index" as a synonym); standard form (we also define "scientific notation" as a synonym); "solve",
"expand", "factorise".

**Command terms in question stems** (MYP usage): *State*, *Write down* (no working needed),
*Find*, *Calculate* (numerical answer, show stages), *Solve*, *Simplify*, *Expand*, *Factorise*,
*Show that*, *Estimate*, *Justify*, *Verify*. Use the term that matches what the checker asks for.

**Notation:**

| Idea | Write | Never |
|---|---|---|
| Multiplication of numbers | `3 \times 4` | `3*4`, `3 . 4` |
| Multiplication in algebra | `3x`, `2(x+1)`, `ab` | `3 \times x` (except while teaching what `3x` means) |
| Division | `\frac{a}{b}`; `\div` only in Stage 1 arithmetic | `a/b` in display maths |
| Powers | `x^{2}` typeset (KaTeX) | caret notation anywhere in the UI |
| Roots | `\sqrt{x}`, `\sqrt[3]{x}` | |
| Decimal point | `3.5` (point) | comma |
| Large numbers † | `12\,500` (thin space as thousands separator) | `12,500` |
| Standard form | `3.2 \times 10^{4}` | `3.2e4` |
| Not equal / approx | `\ne`, `\approx` | |
| Inequality answers † | `-2 < x \le 3` | interval notation (avoided unless taught) |
| Solution sets | `x = 2 \text{ or } x = -3` | |
| Logarithms | `\log_{b} x`; `\log x` means base 10; `\ln x` base e | |
| Recurring decimals | `0.\dot{3}` | `0.333...` |
| Absolute value | `\lvert x \rvert` | |

**Accuracy †:** unless a question says otherwise, non-exact answers are given to 3 significant
figures, and the question states this. Exact answers are preferred whenever the question says
"exact".

**Order of operations:** taught as an idea first (brackets, then exponents, then multiplication
and division left to right, then addition and subtraction left to right). The mnemonics BIDMAS
and BODMAS are mentioned once as memory aids only.

---

## 3. Topic page anatomy

Every topic MDX uses these sections, in this order. `verify:content` checks the order.

1. **Header**: generated from the curriculum entry (thumbnail, stage, time, prerequisites,
   mastery meter). Nothing to write.
2. `<WhyItMatters>`: two or three sentences on what this builds toward.
3. `<Explanation>`: from scratch. Intuition, then concrete numbers, then the rule, then *why* it
   is true. Visuals where they genuinely help, interactive where a slider shows a cause and effect.
   Use `<Section id="...">` so misconceptions can link to the right paragraph.
4. `<WorkedExamples>`: increasing difficulty, every step with its reason. Must include:
   - one example fully solved (`fade: 'full'`),
   - one with the last steps hidden (`fade: 'last-1'` or `'last-2'`),
   - one solved by the learner with a hint available (`fade: 'learner'`),
   - one "fails on purpose" example showing a common mistake and exactly why it is wrong.
5. `<Practice />`: generated problems with checking. Nothing to write beyond configuration.
6. Step-by-step solutions: automatic from the generator.
7. `<Takeaways>`: the rules and the common errors. Feeds the stage cheat sheet, so each item must
   stand alone without the page around it.
8. `<NextUp />` and `<CheckYourself />`: generated; the check set mixes this topic with its
   prerequisites.

---

## 4. MDX components

| Component | Use |
|---|---|
| `<Section id>` | Anchor for misconception and glossary links |
| `<Callout kind="idea" \| "note" \| "warning">` | Short highlighted aside |
| `<Term id>` | Glossary term with hover card; first use on the page |
| `<Prereq id>` | Link to a prerequisite topic, with a one-line reminder |
| `<Claim tex="..." />` | Displays a true statement; **verified at build time** |
| `<Visual name props>` | Static diagram from `ui/diagrams` |
| `<Interactive name props>` | Diagram with controls (slider, drag) |
| `<WorkedExample id>` | Renders an example defined in the generator file |
| `<Misconception id>` | Explains a catalogued misconception in context |
| `<Takeaways>` | Rules and common errors (bulleted) |

Inline maths `$...$` is for expressions that make no numeric claim (`$x^{2}$`, `$a^{m}$`). Any
statement that something *equals* something with specific numbers goes in `<Claim>` so the
engine checks it. Example: write `<Claim tex="8^{\frac{2}{3}} = 4" />`, not `$8^{2/3} = 4$`.

---

## 5. Worked examples

- Defined as parameters in the generator file (`examples`), never as typed-out steps.
- Choose parameters that show one idea at a time: the first example uses the smallest clean
  numbers; later ones add exactly one new complication each.
- Every step's reason is a short sentence that names the rule used ("Multiply the exponents:
  power of a power").
- The "fails on purpose" example names the faulty rule, shows where the wrong line appears, and
  shows the correct line beside it. It must reference a misconception in the catalogue.

---

## 6. Generators

One file per topic in `src/generators/stageN/<topic-id>.ts`. Each skill is one `Generator`.

**Sampling rules**

- Difficulty 1 uses small, friendly numbers and one step type. Difficulty 2 combines two ideas
  or uses negatives and fractions. Difficulty 3 is the harder variant (more steps, less obvious
  structure). Mastery sets need all three.
- Constraints are explicit code, not luck: no division by zero, no zero or one where it makes
  the problem trivial, answers integer or clean unless the difficulty calls otherwise, roots of
  perfect powers where the question expects an exact integer.
- Draw all randomness from the `Rng` argument.

**Each generator provides**

- `build`: prompt (states any required form in words), canonical answer, steps with reasons,
  three hints (nudge, method, first step).
- `solveDirectly`: an independent computation of the answer (different code path from `build`,
  e.g. exact rational arithmetic vs. the step builder).
- `misconceptions`: each typical wrong answer and the faulty rule that produces it.
- `equivalents`: correct rewrites that must be accepted (only forms the question allows).
- `nearMisses`: wrong answers close to the right one (off by sign, off by one, wrong root).
- `isDegenerate` when trivial cases can slip through the constraints.

The shared test harness runs 1,000 seeds per difficulty for every generator. If a generator
cannot pass it, fix the generator; never loosen the test.

---

## 7. Misconceptions and glossary

**Misconceptions** (`src/content/misconceptions.ts`):

```ts
{ id: 'square-over-sum', name: 'Squaring each term of a sum',
  faultyRule: '(a + b)^{2} = a^{2} + b^{2}',
  why: 'Squaring means multiplying the whole bracket by itself, which creates the 2ab terms.',
  topic: 's3-double-brackets', section: 'perfect-squares' }
```

Initial catalogue (grows with each topic): adding exponents when multiplying powers of different
bases; multiplying the base by the exponent; distributing a power over a sum; subtracting a
negative as if it were a negative; cancelling terms instead of factors; adding numerators and
denominators of fractions; dividing only one term by a common factor; sign error when moving a
term across the equals sign; forgetting the negative square root; treating a negative exponent
as a negative number; reading a fractional exponent as division of the base; squaring both sides
without checking for extraneous solutions; reversing an inequality incorrectly; log of a sum
equal to sum of logs.

**Glossary** (`src/content/glossary.ts`): `{ id, term, definition, firstTaughtIn, seeAlso }`.
Definitions use only words a learner at that point already knows.

---

## 8. Curriculum map (proposed, for review)

`→` lists direct prerequisites. Order within each stage is the study order. Items in *italics*
are proposed splits or changes to the original list, awaiting confirmation.

### Stage 1: Arithmetic

| # | id | Title | → |
|---|---|---|---|
| 1 | s1-integers-number-line | Integers and the number line | none |
| 2 | s1-negative-operations | Operations with negative numbers | 1 |
| 3 | s1-order-of-operations | Order of operations (introduces powers as repeated multiplication) | 2 |
| 4 | s1-factors-multiples-primes | Factors, multiples, primes, HCF and LCM | 3 |
| 5 | s1-fractions-equivalent | Fractions as parts; equivalent fractions | 4 |
| 6 | s1-simplifying-fractions | Simplifying fractions | 5 |
| 7 | s1-add-subtract-fractions | Adding and subtracting fractions | 6 |
| 8 | s1-multiply-divide-fractions | Multiplying and dividing fractions | 6, 2 |
| 9 | s1-mixed-numbers | Mixed numbers and improper fractions | 7, 8 |
| 10 | s1-decimals | Decimals and conversions | 6 |
| 11 | s1-percentages | Percentages: of, increase and decrease, reverse | 10, 8 |
| 12 | s1-ratio-proportion | Ratio and proportion | 6, 8 |
| 13 | s1-rates-units | Rates and unit conversion | 12, 10 |
| 14 | s1-estimation | Estimation and sense-checking | 10, 3 |

### Stage 2: Algebra foundations

| # | id | Title | → |
|---|---|---|---|
| 1 | s2-variables-expressions | Variables, terms and expressions | s1-3, s1-2 |
| 2 | s2-like-terms | Collecting like terms | 1 |
| 3 | s2-substitution | Substitution | 1, s1-8 |
| 4 | s2-exponent-laws | Integer exponent laws | 2 |
| 5 | s2-zero-negative-exponents | Zero and negative exponents | 4, s1-8 |
| 6 | s2-standard-form | Scientific notation (standard form) | 5, s1-10 |
| 7 | s2-roots | Square roots and nth roots | 4, s1-4 |
| 8 | s2-surds | Simplifying surds | 7 |
| 9 | s2-fractional-exponents | Fractional exponents; radical and exponent form | 5, 7 |
| 10 | s2-combined-exponent-laws | Combining all exponent laws | 9, 8 |
| 11 | s2-expanding-single-brackets | Expanding single brackets *(and taking out a single common factor)* | 2, s1-2 |
| 12 | s2-one-two-step-equations | One-step and two-step equations | 2 |
| 13 | s2-multi-step-equations | Multi-step equations, brackets, variables on both sides | 11, 12 |
| 14 | s2-equations-with-fractions | Equations with fractions | 13, s1-7 |
| 15 | *s2-rearranging-1* | *Changing the subject: one operation, then many* | 13 |
| 16 | *s2-rearranging-2* | *Changing the subject: powers and roots* | 15, 7 |
| 17 | *s2-rearranging-3* | *Changing the subject: subject twice; in a denominator or root* | 16, 11 |
| 18 | s2-forming-equations | Forming equations from word problems | 13, 14 |

### Stage 3: Intermediate algebra

| # | id | Title | → |
|---|---|---|---|
| 1 | s3-double-brackets | Expanding double brackets and special products | s2-11, s2-4 |
| 2 | *s3-factorise-common-grouping* | *Factorising: common factor and grouping* | 1 |
| 3 | *s3-factorise-trinomials* | *Factorising trinomials* | 2 |
| 4 | *s3-difference-of-squares* | *Factorising the difference of two squares* | 1, 2 |
| 5 | s3-quadratics-factorising | Solving quadratics by factorising | 3, 4, s2-13 |
| 6 | s3-completing-square | Completing the square | 5, s2-8 |
| 7 | s3-quadratic-formula | The quadratic formula and the discriminant | 6 |
| 8 | *s3-alg-fractions-simplify* | *Algebraic fractions: simplify, multiply and divide* | 3, 4, s1-8 |
| 9 | *s3-alg-fractions-add* | *Algebraic fractions: add and subtract* | 8, s1-7 |
| 10 | s3-equations-alg-fractions | Equations with algebraic fractions | 9, 5 |
| 11 | s3-radical-equations | Radical equations and extraneous solutions | 5, s2-16 |
| 12 | s3-absolute-value-equations | Absolute value equations | s1-1, s2-13 |
| 13 | s3-simultaneous-linear | Simultaneous equations: substitution and elimination | s2-13, s2-15 |
| 14 | s3-simultaneous-linear-quadratic | Simultaneous equations: linear with quadratic | 13, 5 |
| 15 | s3-linear-inequalities | Linear inequalities | s2-13 |
| 16 | s3-quadratic-inequalities | Quadratic inequalities | 15, 5 |
| 17 | *s3-exp-log-intro* | *Exponentials and logarithms: log as the inverse* | s2-10 |
| 18 | *s3-log-laws* | *Log laws* | 17 |
| 19 | *s3-exp-log-equations* | *Solving exponential and log equations* | 18, s2-15 |

Each stage ends with a stage test and a cheat sheet built from its `<Takeaways>`.

---

## 9. Checklist before a topic is done

- [ ] Curriculum entry, generator file and MDX exist; nothing else was needed.
- [ ] Every term defined at first use, every prerequisite linked, nothing from later topics.
- [ ] Explanation answers what, why and where people go wrong.
- [ ] Four worked examples (full, faded, learner, fails-on-purpose), all from parameters.
- [ ] Every numeric statement in prose is a `<Claim>`.
- [ ] Visuals readable in Obsidian, Pearl and Eclipse; no overlapping labels.
- [ ] Generator suite passes (1,000 seeds × 3 difficulties).
- [ ] `npm run verify:content` passes.

---

## 10. References

- Sweller, J. and Cooper, G. A. (1985). The use of worked examples as a substitute for problem
  solving in learning algebra. *Cognition and Instruction*, 2(1), 59–89.
  [Summary](https://en.wikipedia.org/wiki/Worked-example_effect)
- Renkl, A. and Atkinson, R. K. Structuring the transition from example study to problem
  solving: fading worked-out steps.
  [Review paper](https://faculty.engineering.asu.edu/mre/wp-content/uploads/sites/31/2020/02/Exp_Rev_LI06.pdf)
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J. and Willingham, D. T. (2013).
  Improving students' learning with effective learning techniques. *Psychological Science in the
  Public Interest*, 14(1). doi:10.1177/1529100612453266.
  [APS summary](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T. and Rohrer, D. (2006). Distributed practice
  in verbal recall tasks: a review and quantitative synthesis. *Psychological Bulletin*, 132,
  354–380. [PubMed](https://pubmed.ncbi.nlm.nih.gov/16719566/)
- Rohrer, D. and Taylor, K. (2007). The shuffling of mathematics problems improves learning.
  *Instructional Science*, 35, 481–498.
  [Rohrer 2014 overview](https://www.gwern.net/doc/psychology/spaced-repetition/2014-rohrer.pdf)
- Wozniak, P. (1990). SM-2 algorithm, SuperMemo.
  [Overview](https://en.wikipedia.org/wiki/SuperMemo)
- W3C (2023). Web Content Accessibility Guidelines (WCAG) 2.2.
  [https://www.w3.org/TR/WCAG22/](https://www.w3.org/TR/WCAG22/)
- IB MYP mathematics command terms and assessment criteria (secondary summaries; the official
  subject guide is in the IB Programme Resource Centre):
  [Tutopiya](https://www.tutopiya.com/blog/ib/command-words-keywords/ib-myp-mathematics-command-terms),
  [RevisionDojo](https://www.revisiondojo.com/blog/how-is-myp-math-assessed)
