# Abstract interpreter for While+

An abstract interpreter for a small imperative language, based on the theory of abstract interpretation of Patrick and Radhia Cousot. Course project for *Software Verification*, University of Padua.

Programs are analysed statically, without being executed, in the **interval domain**: each variable is approximated by an interval over ℤ. The analysis uses threshold-based widening and narrowing to ensure termination, and backward condition filtering (HC4-revise) to refine intervals on branches.

## Status

Course project. Some edge cases of the analysis are still open.
