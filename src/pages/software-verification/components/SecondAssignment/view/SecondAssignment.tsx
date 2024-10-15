import { useState } from "react";
import Latex from "react-latex-next";

import CodeEditor from "react-textarea-code-editor-2";

import "./SecondAssignment.css";
import { Lexer } from "../../../logic/lexer";
import { Parser } from "../../../logic/parser";
import { IntervalFactory } from "../logic/IntDomain/interval_factory";
import { InitialStateFormatError, ProgramFormatError } from "../../../model/errors";
import { IntervalDomain } from "../logic/IntDomain/intervals_domain";
import prettyPrintStatement from "../../../logic/pretty_printer";

const SecondAssignment = () => {
	const [formFields, setFormFields] = useState({
		program: "",
		abstractState: "",
		lowerBound: Number.MIN_SAFE_INTEGER,
		upperBound: Number.MAX_SAFE_INTEGER,
		variables: new Set<String>(),
		widening: true,
		narrowing: true,
	});

	const [results, setResults] = useState({
		abstractProgramState: "",
		tokenList: "",
		ast: "",
		annotatedProgram: "",
		denotationalSemantic: "",
		dSharpResult: "",
	});

	const [errors, setErrors] = useState({ programFormatError: "", asbtractStateFormatError: "" });

	const _submit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrors({ programFormatError: "", asbtractStateFormatError: "" });

		// Instantiation of interval domain
		let intervalDomain: IntervalDomain = new IntervalDomain(new IntervalFactory(formFields.lowerBound, formFields.upperBound), formFields.widening, formFields.narrowing);

		setResults((prevState) => ({
			...prevState,
			abstractProgramState: "In progress",
			tokenList: "In progress",
			ast: "In progress",
			denotationaSemantic: "In progress",
			dSharpResult: "In progress",
		}));

		try {
			// Abstract state
			let abstractState = Parser.parseAbstractState(Lexer.tokenize(formFields.abstractState), new IntervalFactory(formFields.lowerBound, formFields.upperBound));
			setResults((prevState) => ({
				...prevState,
				abstractProgramState: abstractState.toString(),
			}));

			// Program
			let tokenList = Lexer.tokenize(formFields.program);
			setResults((prevState) => ({
				...prevState,
				tokenList: tokenList.map((e) => e.toString()).join(" "),
			}));
			let program = Parser.parse(tokenList);
			setResults((prevState) => ({
				...prevState,
				ast: prettyPrintStatement(program),
				annotatedProgram: program.toAnnotatedProgram(),
				denotationalSemantic: program.toString(),
			}));

			// Interpretation
			let dSharpResult = intervalDomain.dSharp(program, abstractState);
			setResults((prevState) => ({
				...prevState,
				dSharpResult: dSharpResult.toString(),
			}));
		} catch (e) {
			_clearResult();
			console.log(e);
			if (e instanceof InitialStateFormatError) {
				setErrors((prevState) => ({ ...prevState, asbtractStateFormatError: (e as InitialStateFormatError).message }));
			} else if (e instanceof ProgramFormatError) {
				setErrors((prevState) => ({ ...prevState, programFormatError: (e as ProgramFormatError).message }));
			} else {
				setErrors((prevState) => ({
					...prevState,
					asbtractStateFormatError: `${(e as Error).message} ¯\\(°_o)/¯`,
					programFormatError: `${(e as Error).message} ¯\\(°_o)/¯`,
				}));
			}
		}
	};

	function _clearResult() {
		setResults((prevState) => ({
			...prevState,
			abstractProgramState: "",
			tokenList: "",
			ast: "",
			annotatedProgram: "",
			denotationalSemantic: "",
			dSharpResult: "",
		}));
		setFormFields((prevState) => ({
			...prevState,
			program: "",
			abstractState: "",
			lowerBound: Number.MIN_SAFE_INTEGER,
			upperBound: Number.MAX_SAFE_INTEGER,
			variables: new Set<String>(),
			widening: true,
			narrowing: true,
		}));
		setErrors((prevState) => ({
			...prevState,
			programFormatError: "",
			asbtractStateFormatError: "",
		}));
	}

	const _smokeExample = new Map<string, () => void>()
		.set("Arithmetic", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: `p:[0,0]; q:[0,0]; r:[0,0]`,
				program: `p = 3;
q = p * 4 + 2;
r = q - p`,
			}));
		})
		.set("Assignment", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: `p:[0,0]; q:[0,0]; r:[0,0]`,
				program: `p = 3;
q = p * 4 + 2;
r = q - p`,
			}));
		})
		.set("Conditional", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: `x:[0,10]`,
				program: `if (x > 5) then { x = x + 2 } else { x = x - 1 }`,
			}));
		})
		.set("While", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: `y:[0,0]`,
				program: `while (y < 10) { y = y + 1 }`,
			}));
		})
		.set("For", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: `a:[1, 1]; b : [0,0]`,
				program: `for (b = 0; b < 3; b = b + 1) { a = a * 2 }`,
			}));
		})
		.set("Repeat-Until", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: `c:[0,0]`,
				program: `repeat { c = c + 2 } until (c >= 10)`,
			}));
		})
		.set("Infinte-Loop", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: `counter:[0,0]`,
				program: `while (counter >= 0) { counter = counter + 1 }`,
				widening: true,
			}));
		});

	const _expandedExample = new Map<string, () => void>()
		.set("Factorial", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: `x:[3,3]; y:[0,0]`,
				program: `while(x>1){
  y=x*y;
  x=x-1
}`,
			}));
		})
		.set("GCD", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: "a : [56,56];b : [98,98];temp : [0,0]",
				program: `while (b != 0) {
  temp = b;
  b = a % b;
  a = temp
}`,
			}));
		})
		.set("Nth Fibonacci", () => {
			setFormFields((prevState) => ({
				...prevState,
				abstractState: "n:[3,3]; result:[0,0]; i:[0,0]; fibCurrent:[1,1]; fibPrev:[0,0]; fibNext:[0,0]",
				program: `if(n <= 1) then {
  result = n
} else {
    if(result != n) then{
      for(i = 2; i <= n; i++){
        fibNext = fibPrev + fibCurrent;
        fibPrev = fibCurrent;
        fibCurrent = fibNext
      };
      result = fibCurrent
    } else {
      skip
    }
}`,
			}));
		});

	return (
		<div id="second-assignment">
			<h2>Second assignment</h2>
			<p>
				<Latex>
					{
						"Implement an abstract interpreter for the abstract denotational semantics $D^\\#$ of While (cf. Chapter 4 of the lecture notes), where the language includes arithmetic expressions that may give rise to run-time errors, such as integer divisions <em>a1 % a2</em>, and may modify the current state, such as variable increments <em>x++</em> and decrements <em>x--</em>."
					}
				</Latex>
			</p>
			<p>
				<Latex>{"More in detail, this means to write a program $\\textit{AI}$, in a suitable programming language of free choice, such that:"}</Latex>
			</p>
			<ul>
				<li>
					<p>
						<Latex>
							{
								"The abstract interpreter $\\textit{AI}$ can be instantianted to a numerical abstract domain $A$ which abstracts $℘(\\Z)$ and to a state abstract domain $S$ which abstracts $℘(State)$ and is automatically derived from $A$ as a non-relational variable-wise abstract domain, so that the instantiation to $A$ is denoted by $AI_A$. One can assume that the abstract domain $A$ is a complete lattice so that $A$ is defined together with its partial order relation, bottom and top elements, lub, glb, widening and narrowing operators if needed."
							}
						</Latex>
					</p>
				</li>
				<li>
					<p>
						<Latex>
							{
								"$AI_A$ takes as input any program $P \\in While$ and abstract state $s^\\# \\in S$ (for the variables occurring in $P$ ). $AI_A(P, s^\\#)$ provides as output $D^\\#[\\![P]\\!]s^\\#$. As an optional task, $AI_A(P, s^\\#)$ may also provide as output the abstract loop invariants for any loop occurring in $P$ , which are computed by $AI_A(P, s^\\#)$ in order to compute its output $D^\\#[\\![P]\\!]s^\\#$ (therefore this goal could be achieved by suitably storing the needed information for computing $AI_A(P, s^\\#)$)."
							}
						</Latex>
					</p>
				</li>
				<li>
					<p>
						<Latex>{"Instantiate $AI$ to the following parametric restriction of the interval abstract domain $Int$:"}</Latex>
					</p>
					<p>
						<Latex>{"$Given \\space m, n \\in Z \\cup \\{-\\infty, +\\infty\\},\\space define$"}</Latex>
					</p>
					<p>
						<Latex>
							{
								"$Int_{m,n} \\overset{def}{=} \\{\\empty, \\Z \\} \\cup \\{[k, k] \\space | \\space k \\in \\Z \\} \\cup \\{[a, b] \\space | \\space a < b, [a, b] \\subseteq [m, n]\\} \\cup \\{(-\\infty, k] \\space | \\space k \\in [m, n]\\} \\cup \\{[k, -\\infty) \\space | \\space k \\in [m, n]\\} $"
							}
						</Latex>
					</p>
					<p>
						<Latex>
							{
								"Thus, we have that $Int_{-\\infty,+\\infty}$ = $Int$ and if $m > n$ then $Int_{m,n}$ is the constant propagation domain. If $m, n \\in \\Z$ then $Int_{m,n}$ has no infinite ascending chains, thus an analysis with $Int_{m,n}$, at least in principle, would not need a widening. In order to run an analysis with $Int_{m,n}$, first the user must instantiate the parameters $m$ and $n$. One could also automatically infer the parameters $m$ and $n$ from a simple syntactic analysis of the input program, e.g. based on some suitable heuristics."
							}
						</Latex>
					</p>
				</li>
			</ul>
			<div className="submission">
				<h3>Submission</h3>
				<h4>Instructions and notes</h4>
				<p>
					<em>Note:</em> ℕ is {"{ x | -9007199254740991 < x < 9007199254740991 }"}, due to maximum safe value for javascript version of integers.
				</p>
				<div className="syntaxes">
					<div className="initial-state-syntax">
						<h5>Abstract state grammar</h5>
						<p>
							<Latex>{"$n \\in \\Z \\cup \\{-\\inf\\} \\cup \\{+\\inf\\}$"}</Latex>
						</p>
						<p>
							<Latex>{"$var \\in [a-z]+$"}</Latex>
						</p>
						<p>
							<Latex>{"$Int \\Coloneqq [n,n] \\space | \\space top \\space | \\space bottom $"}</Latex>
						</p>
						<p>
							<Latex>{"$S(var) \\Coloneqq \\space var : Int \\space | \\space S(var) ; S(var') $"}</Latex>
						</p>
					</div>
					<div className="while-plus-syntax">
						<h5>While grammar</h5>
						<p>
							<Latex>{"$n \\in \\N$"}</Latex>
						</p>
						<p>
							<Latex>{"$x \\in [a-z]+$"}</Latex>
						</p>
						<p>
							<Latex>{"$\\triangle \\Coloneqq \\quad != \\space | \\space == \\space | \\space < \\space | \\space <= \\space | \\space > \\space | \\space >=$"}</Latex>
						</p>
						<p>
							<Latex>{"$\\square \\Coloneqq \\space \\&\\& \\space | \\space ||$"}</Latex>
						</p>
						<p>
							<Latex>{"$\\Diamond \\Coloneqq \\space + \\space | \\space - \\space | \\space * \\space | \\space \\% \\space$"}</Latex>
						</p>
						<p>
							<Latex>{"$A \\Coloneqq \\space n \\space | \\space x \\space | \\space (A) \\space | \\space  -(A) \\space | \\space A_1 \\space \\Diamond \\space A_2  $"}</Latex>
						</p>
						<p>
							<Latex>{"$B \\Coloneqq \\space true \\space | \\space false \\space | \\space (B) \\space | \\space !(B) \\space | \\space A_1 \\space \\triangle \\space A_2 \\space | \\space B_1 \\space \\square \\space B_2$"}</Latex>
						</p>
						<p>
							<Latex>{"$S \\Coloneqq \\space x=A \\space | \\space skip \\space | \\space x++ \\space | \\space x-- $"}</Latex>
						</p>
						<p>
							<Latex>{"$while \\Coloneqq \\space S \\space | \\space  while_1;while_2 $"}</Latex>
						</p>
						<p>
							<Latex>{"$\\quad\\quad\\quad\\quad\\quad |\\space \\textbf{if} \\space (B)\\space \\textbf{then} \\space \\{\\space while_1 \\space\\}\\space \\textbf{else} \\space \\{\\space while_2\\space \\} $"}</Latex>
						</p>
						<p>
							<Latex>{"$\\quad\\quad\\quad\\quad\\quad |\\space \\textbf{while} \\space (B)\\space \\{\\space while \\space\\}$"}</Latex>
						</p>
						<p>
							<Latex>{"$\\quad\\quad\\quad\\quad\\quad |\\space \\textbf{repeat} \\space\\{\\space while \\space\\} \\space \\textbf{until} \\space (B)$"}</Latex>
						</p>
						<p>
							<Latex>{"$\\quad\\quad\\quad\\quad\\quad |\\space \\textbf{for} \\space (S_1;B;S_2) \\space \\{\\space while \\space\\}$"}</Latex>
						</p>
					</div>
				</div>
				<h4>Examples</h4>
				<h5>Smoke</h5>
				<div className="button-row">
					{Array.from(_smokeExample.keys()).map((e) => (
						<button key={e} onClick={_smokeExample.get(e)}>
							{e}
						</button>
					))}
				</div>
				<h5>Expanded</h5>
				<div className="button-row">
					{Array.from(_expandedExample.keys()).map((e) => (
						<button key={e} onClick={_expandedExample.get(e)}>
							{e}
						</button>
					))}
				</div>
				<h4>Input</h4>
				<form onSubmit={_submit}>
					<label>
						While program:
						<CodeEditor
							required
							value={formFields.program}
							language="c++"
							placeholder="Use the grammar above and write a While program."
							onChange={(event) => {
								setFormFields((prevState) => ({ ...prevState, program: event.target.value }));
								setErrors((_) => ({ programFormatError: "", asbtractStateFormatError: "" }));
							}}
							padding={15}
							style={{
								fontSize: 12,
								fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
								border: "1px solid black",
								borderRadius: "5px",
								width: "100%",
								margin: "10px auto 0 auto",
								borderColor: errors.programFormatError.length > 0 ? "red" : "",
								transition: "border-color .1s ease-in-out",
							}}
						/>
						{errors.programFormatError.length > 0 && <p className="error">{errors.programFormatError}</p>}
					</label>

					<label>
						Abstract state:
						<CodeEditor
							required
							language="c++"
							value={formFields.abstractState}
							placeholder="Write an abstract state for the variable of the program."
							onChange={(evn) => {
								setFormFields((prevState) => ({ ...prevState, abstractState: evn.target.value }));
								setErrors((_) => ({ programFormatError: "", asbtractStateFormatError: "" }));
							}}
							padding={15}
							style={{
								fontSize: 12,
								fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
								border: "1px solid black",
								borderRadius: "5px",
								width: "100%",
								margin: "10px auto 0 auto",
								borderColor: errors.asbtractStateFormatError.length > 0 ? "red" : "",
								transition: "border-color .1s ease-in-out",
							}}
						/>
						{errors.asbtractStateFormatError.length > 0 && <p className="error">{errors.asbtractStateFormatError}</p>}
					</label>
					<label>
						{"Lower domain's bounds (^-?\\d+$) : "}
						<input
							type="text"
							placeholder="-∞"
							onChange={(evn) => {
								setFormFields((prevState) => ({ ...prevState, lowerBound: evn.target.value.length === 0 ? Number.MIN_SAFE_INTEGER : parseInt(evn.target.value) }));
								setErrors((_) => ({ programFormatError: "", asbtractStateFormatError: "" }));
							}}
							pattern="^-?\d+$"
							style={{
								display: "inline-block",
								fontSize: 12,
								fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
								border: "1px solid black",
								borderRadius: "5px",
								borderColor: "black",
								padding: "10px",
								margin: "10px auto 0 auto",
								transition: "border-color .1s ease-in-out",
							}}
						/>
					</label>
					<label>
						{"Upper domain's bounds (^-?\\d+$) : "}
						<input
							placeholder="+∞"
							type="text"
							pattern="^-?\d+$"
							onChange={(evn) => {
								setFormFields((prevState) => ({ ...prevState, upperBound: evn.target.value.length === 0 ? Number.MAX_SAFE_INTEGER : parseInt(evn.target.value) }));
								setErrors((_) => ({ programFormatError: "", asbtractStateFormatError: "" }));
							}}
							style={{
								display: "inline-block",
								fontSize: 12,
								fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
								border: "1px solid black",
								borderRadius: "5px",
								borderColor: "black",
								padding: "10px",
								margin: "10px auto 0 auto",
								transition: "border-color .1s ease-in-out",
							}}
						/>
					</label>
					<label>
						<input type="checkbox" checked={formFields.widening} onChange={(evn) => setFormFields((prevState) => ({ ...prevState, widening: evn.target.checked }))} name="widening" /> Apply widening.
					</label>
					<label>
						<input type="checkbox" checked={formFields.narrowing} onChange={(evn) => setFormFields((prevState) => ({ ...prevState, narrowing: evn.target.checked }))} name="narrowing" /> Apply narrowing.
					</label>
					<input id="first-assignment-button" type="submit" value="RUN" />
					<button type="button" className="secondary" onClick={_clearResult}>
						CLEAR
					</button>
				</form>
				{results.abstractProgramState.length > 0 && (
					<div className="result">
						<h4>Results</h4>
						<h5>Input data</h5>
						<p aria-label="Initial state:">{results.abstractProgramState.replace(/ /g, "\u00A0")}</p>
						<p aria-label="Token list:">{results.tokenList.length > 0 ? results.tokenList : "[ ]"}</p>
						<pre aria-label="Ast:">{results.ast}</pre>
						<h5>Output data</h5>
						<pre aria-label="Annotated program:">{results.annotatedProgram}</pre>
						<p aria-label="Evaluation result:">{results.dSharpResult}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default SecondAssignment;
