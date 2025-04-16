<article>
  <h1 style="font-family: Anton; font-size: 2rem;">Abstract Interpreter Guide</h1>
  <p style="font-family: CutiveMono; font-size: 0.9rem; color: #aaa;">An academic implementation reference</p>

<nav>
    <h2>Contents</h2>
    <ul>
      <li><a href="#overview">Overview</a></li>
      <li><a href="#grammar">Language Grammar</a></li>
      <li><a href="#abstract">Abstract Semantics</a></li>
      <li><a href="#implementation">Implementation Notes</a></li>
      <li><a href="#examples">Examples</a></li>
      <li><a href="#acknowledgements">Acknowledgements</a></li>
    </ul>
  </nav>

<section id="overview">
    <h2>Overview</h2>
    <p>
      This project implements an abstract interpreter designed for a small imperative language. The interpreter is inspired by the theory of 
      <em>abstract interpretation</em> introduced by Patrick and Radhia Cousot.
    </p>
    <p>
      The tool analyzes programs statically (without executing them) by simulating their behavior in an abstract domain. In this implementation, the abstract domain used is the <strong>interval domain</strong>, where variable values are represented as intervals over ℤ.
    </p>
  </section>

<section id="grammar">
  <h2>Language Grammar</h2>
  <p>
    The source language is a simple imperative language composed of arithmetic expressions, boolean conditions, assignments, conditional branches, loops, and variable declarations.
  </p>

<p>The grammar is defined below using extended BNF notation:</p>

<pre><code>
Program       ::= S ; S
S             ::= var V
               |  var V (N, N)
               |  V = A
               |  if ( C ) then { S } else { S }
	       |  while ( B ) { S }
               |  repeat { S } until ( B )
               |  for ( S; B; S ) { S }
A             ::= N
               |  V
	       |  (A)
	       |  -(A)
               |  A + A
               |  A - A
               |  A * A
	       |  A / A
               |  V++
               |  V--
B             ::= true
               |  false
               |  (B)
               |  !(B)
	       |  B && B
	       |  B || B
               |  A == A
               |  A != A
               |  A < A
               |  A > A
               |  A <= A
               |  A >= A
V             ::= [a-zA-Z_][a-zA-Z0-9_]*
N             ::= [0-9]+


Variable declarations can optionally specify an initial interval using the `var x(a, b)` syntax, which maps to the abstract interval [a, b].
