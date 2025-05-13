<article>
	<h1 style="font-family: Anton; font-size: 2rem">Abstract Interpreter Guide</h1>
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
		<p>The tool analyzes programs statically (without executing them) by simulating their behavior in an abstract domain. In this implementation, the abstract domain used is the <strong>interval domain</strong>, where variable values are represented as intervals over ℤ.</p>
	</section>

	<section id="grammar">
		<h2>Language Grammar</h2>
		<p>The source language is a simple imperative language composed of arithmetic expressions, boolean conditions, assignments, conditional branches, loops, and variable declarations.</p>
		<table class="w-full text-left text-sm border-separate border-spacing-y-2">
			<tbody class="font-mono">
				<tr>
					<td class="pr-4 font-semibold">n</td>
					<td class="pr-4 text-gray-500">&in;</td>
					<td class="text-blue-700">&naturals;</td>
				</tr>
				<tr>
					<td class="pr-4 font-semibold">x</td>
					<td class="pr-4 text-gray-500">&in;</td>
					<td class="text-blue-700">[a-z]+</td>
				</tr>
				<tr>
					<td class="pr-4 font-semibold">&#x25B3;</td>
					<td class="pr-4 text-gray-500">::=</td>
					<td class="text-blue-700">!= | == | &lt; | &le; | &gt; | &ge;</td>
				</tr>
				<tr>
					<td class="pr-4 font-semibold">&#x25A1;</td>
					<td class="pr-4 text-gray-500">::=</td>
					<td class="text-blue-700">&amp;&amp; | ||</td>
				</tr>
				<tr>
					<td class="pr-4 font-semibold">&#x25C7;</td>
					<td class="pr-4 text-gray-500">::=</td>
					<td class="text-blue-700">+ | - | * | /</td>
				</tr>
				<tr>
					<td class="pr-4 font-semibold">A</td>
					<td class="pr-4 text-gray-500">::=</td>
					<td class="text-blue-700">n | x | (A) | -(A) | A<sub>1</sub> &#x25C7; A<sub>2</sub> | x++ | x--</td>
				</tr>
				<tr>
					<td class="pr-4 font-semibold">B</td>
					<td class="pr-4 text-gray-500">::=</td>
					<td class="text-blue-700">true | false | (B) | !(B) | A<sub>1</sub> &#x25B3; A<sub>2</sub> | B<sub>1</sub> &#x25A1; B<sub>2</sub></td>
				</tr>
				<tr>
					<td class="pr-4 font-semibold">S</td>
					<td class="pr-4 text-gray-500">::=</td>
					<td class="text-blue-700">x = A | skip</td>
				</tr>
				<tr>
					<td class="pr-4 font-semibold align-top">while</td>
					<td class="pr-4 text-gray-500 align-top">::=</td>
					<td class="text-blue-700 space-y-1">
						<div>S</div>
						<div>while<sub>1</sub>; while<sub>2</sub></div>
						<div><b>if</b> (B) <b>then</b> { while<sub>1</sub> } <b>else</b> { while<sub>2</sub> }</div>
						<div><b>while</b> (B) { while }</div>
						<div><b>repeat</b> { while } <b>until</b> (B)</div>
						<div><b>for</b> (S<sub>1</sub>; B; S<sub>2</sub>) { while }</div>
					</td>
				</tr>
			</tbody>
		</table>
	</section>
	<section id="abstract"></section>
	<img src="https://raw.githubusercontent.com/jacopo-angeli/software-verififcation-project/refs/heads/main/docs/AbstractSemantics.png" alt="Abstract Semantics" />
	<section id="implementation"></section>
	<section id="example"></section>
	<section id="references"></section>
</article>
