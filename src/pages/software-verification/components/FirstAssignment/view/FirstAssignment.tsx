import { useState } from "react";
import { Lexer } from "../../../logic/lexer";
import { Parser } from "../../../logic/parser";
import { Token } from "../../../model/token";
import { Skip, Statement } from "../../../model/while+/statement";
import { ProgramState } from "../model/program_state";

import CodeEditor from "react-textarea-code-editor-2";

import "./FirstAssignment.css";
import { InitialStateFormatError } from "../../../model/errors";
import Latex from "react-latex-next";
import Sds from "../logic/sds";
import prettyPrintStatement from "../../../logic/pretty_printer";

const FirstAssignment = () => {
	var [initialState, setInitialState] = useState("");
	var [program, setProgram] = useState("");
	var [iterationLimit, setIterationLimit] = useState(300000);

	const [initialStateFormatError, setInitialStateFormatError] = useState("");
	const [programFormatError, setProgramFormatError] = useState("");

	var [initialStateResult, setInitialStateResult] = useState(new ProgramState());
	var [tokenList, setTokenList] = useState([] as Array<Token>);
	var [programStatement, setProgramStatement] = useState(new Skip() as Statement);
	var [evaluationResult, setEvaluationResult] = useState(new ProgramState());

	const submit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setInitialStateResult(new ProgramState());
		setInitialStateFormatError("");
		setProgramFormatError("");

		try {
			let initialStateResult = Parser.parseInitialState(Lexer.tokenize(initialState));
			setInitialStateResult(initialStateResult.copy());
			let tokenListResult = Lexer.tokenize(program);
			setTokenList(tokenListResult);
			let ast = Parser.parse(tokenListResult);
			setProgramStatement(ast);
			let eR = Sds.eval(ast, initialStateResult, isNaN(iterationLimit) ? Number.POSITIVE_INFINITY : iterationLimit);
			setEvaluationResult(eR);
		} catch (error) {
			console.log(error);
			if (error instanceof InitialStateFormatError) setInitialStateFormatError(error.message);
			else {
				setInitialStateFormatError(`${(error as Error).message} `);
				setProgramFormatError(`${(error as Error).message}`);
			}
		}
	};
	const _smokeExample = new Map<string, () => void>()
		.set("Arithmetic", () => {
			setInitialState("p=0; q=0; r=0;");
			setProgram(`p = 3;
q = p * 4 + 2;
r = q - p`);
		})
		.set("Assignment", () => {
			setInitialState("p=0; q=0; r=0;");
			setProgram(`p = 3;
q = p * 4 + 2;
r = q - p`);
		})
		.set("Conditional", () => {
			setInitialState("x=0;");
			setProgram(`if (x > 5) then { x = x + 2 } else { x = x - 1 }`);
		})
		.set("While", () => {
			setInitialState("y=0;");
			setProgram(`while (y < 10) { y = y + 1 }`);
		})
		.set("For", () => {
			setInitialState("a=1; b=0;");
			setProgram(`for (b = 0; b < 3; b = b + 1) { a = a * 2 }`);
		})
		.set("Repeat-Until", () => {
			setInitialState("c=0;");
			setProgram(`repeat { c = c + 2 } until (c >= 10)`);
		})
		.set("Infinte-Loop", () => {
			setInitialState("counter=0;");
			setProgram(`while (counter >= 0) { counter = counter + 1 }`);
		});

	const _expandedExampleFirst = new Map<string, () => void>()
		.set("GCD", () => {
			setInitialState("a = 56;b = 98;temp=0;");
			setProgram(`while (b != 0) {
  temp = b;
  b = a % b;
  a = temp
}`);
		})
		.set("Is Prime", () => {
			setInitialState("x=0; number=5; result = 1;");
			setProgram(`if(number<=1) then {
  result = 0	
} else {
  for (x = 2; x < number && result == 1; x=x++){
    if (number % x == 0) then {
      result = 0
    } else {
      skip
    }
  }
}`);
		})
		.set("Factorial", () => {
			setInitialState("y=1;x=5;");
			setProgram(`while(!(x==1)){
  y=x*y;
  x=x-1
}`);
		})
		.set("Nth Fibonacci", () => {
			setInitialState(`n=3; result=0; i=0; fibCurrent=1; fibPrev=0; fibNext=0;`);
			setProgram(`if(n <= 1) then {
  result = n
} else {
  if(result != n) then{
   for(i = 2; i <= n; i=i++){
    fibNext = fibPrev + fibCurrent;
    fibPrev = fibCurrent;
    fibCurrent = fibNext
   };
   result = fibCurrent
  } else {
    skip
  }
}`);
		});

	function _clearResult() {
		setInitialState("");
		setProgram("");
		setInitialStateResult(new ProgramState());
		setTokenList([] as Array<Token>);
		setProgramStatement(new Skip());
		setEvaluationResult(new ProgramState());
		setInitialStateFormatError("");
		setProgramFormatError("");
	}

	return (
		<div id="first-assignment">
			<h2>First Assignment</h2>
			<p>
				<Latex>
					{`Design and implement an interpreter for the denotational semantics of While+. This means to write a program I, in the programming language you prefer and deem more suitable, such that:<br>
						<ul>
							<li>
							I takes as input any $ S \\in While+$ and some representation of $s \\in State$ 
							</li>
							<li>
							$While+$ is $While$, plus some syntactic sugar for Arithmetic/Boolean expressions and statements. Including for and repeat-until loops.
							</li>
							<li>
							$I$ relies on Kleene-Knaster-Tarski fixpoint iteration sequence for evaluating the while statements. This means that if $F : (State \\hookrightarrow State) \\rightarrow (State \\hookrightarrow State)$ is the functional induced by a loop program $while \\space b \\space do \\space S$, then $I(while \\space b \\space do \\space S, s)$ must be implemented as $(\\sqcup_{n≥0} F^n(\\perp))s$. 
							This means that $I(while \\space b \\space do \\space S, s)$ has to look for the least $k ≥ 0$ such that $F^k(\\perp)s = s'$ for some $s'$ so that the call $I(while \\space b \\space do \\space S, s)$ outputs $s'$, whereas if for all $n \\ge 0$, $F^n(\\perp)s = undef$ then the call $I(while \\space b \\space do \\space S, s)$ does not terminate with no run-time error/exception.
							</li>
						</ul>`}
				</Latex>
			</p>
			<div className="submission">
				<h3>Submission</h3>
				<h4>Instructions and notes</h4>
				<p>
					Using the following syntax, insert an initial state and a while+ program, use the <a href="#first-assignment-button">"run" button</a> below to check the results.
				</p>
				<p>
					<b>Note:</b> as part of the instructions, running the program with the "Fix point iteration limit" field empty, may lead to an apparently freeze of the window due to the infinite fixed point search (if used a loop construct). The infinite looping can be witnessed using the browser console.
				</p>
				<div className="syntaxes">
					<div className="initial-state-syntax">
						<h5>Initial state grammar</h5>
						<p>
							<Latex>
								{`$\\begin{array}{rcl}
									x & \\in & [a-z]+ \\\\
									S(var) & \\Coloneqq & var=n; | S(var) S(var') \\\\
									\\end{array}$`}
							</Latex>
						</p>
					</div>
					<div className="while-plus-syntax">
						<h5>While grammar</h5>
						<p>
							<Latex>
								{`$\\begin{array}{rcl} 
									n & \\in & \\N \\\\ 
									x & \\in & [a-z]+ \\\\\\\\
									\\triangle & \\Coloneqq & != \\space | \\space == \\space | \\space < \\space | \\space <= \\space | \\space > \\space | \\space >= \\\\
									\\square & \\Coloneqq & \\space \\&\\& \\space | \\space || \\\\
									\\Diamond & \\Coloneqq & \\space + \\space | \\space - \\space | \\space * \\space | \\space \\ / \\space \\\\\\\\
									A & \\Coloneqq & \\space n \\space | \\space x \\space | \\space (A) \\space | \\space  -(A) \\space | \\space A_1 \\space \\Diamond \\space A_2 | \\space x++ \\space | \\space x--  \\\\
									B & \\Coloneqq & \\space true \\space | \\space false \\space | \\space (B) \\space | \\space !(B) \\space | \\space A_1 \\space \\triangle \\space A_2 \\space | \\space B_1 \\space \\square \\space B_2 \\\\
									S & \\Coloneqq & \\space x=A \\space | \\space skip \\\\
									while & \\Coloneqq & \\space S \\space | \\space  while_1;while_2 \\\\
									& | &\\space \\textbf{if} \\space (B)\\space \\textbf{then} \\space \\{\\space while_1 \\space\\}\\space \\textbf{else} \\space \\{\\space while_2\\space \\} \\\\
									& | &\\space \\textbf{while} \\space (B)\\space \\{\\space while \\space\\}\\\\
									& | &\\space \\textbf{repeat} \\space\\{\\space while \\space\\} \\space \\textbf{until} \\space (B)\\\\
									& | &\\space \\textbf{for} \\space (S_1;B;S_2) \\space \\{\\space while \\space\\}
									\\end{array}$`}
							</Latex>
						</p>
					</div>
				</div>
				<h4>Examples</h4>
				<div className="button-row"></div>
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
					{Array.from(_expandedExampleFirst.keys()).map((e) => (
						<button key={e} onClick={_expandedExampleFirst.get(e)}>
							{e}
						</button>
					))}
				</div>
				<h4>Input</h4>
				<form onSubmit={submit}>
					<label>
						While+ program:
						<CodeEditor
							required
							value={program}
							language="c++"
							placeholder="Write a While+ program."
							onChange={(evn) => setProgram(evn.target.value)}
							padding={15}
							style={{
								fontSize: 12,
								fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
								border: "1px solid black",
								borderRadius: "5px",
								width: "100%",
								margin: "10px auto 0 auto",
								borderColor: programFormatError.length > 0 ? "red" : "",
								transition: "border-color .1s ease-in-out",
							}}
						/>
						{programFormatError.length > 0 && <p className="error">{programFormatError}</p>}
					</label>
					<label>
						Initial state:
						<CodeEditor
							required
							value={initialState}
							language="c++"
							placeholder="Write some initial state s."
							onChange={(evn) => setInitialState(evn.target.value)}
							padding={15}
							style={{
								fontSize: 12,
								fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
								border: "1px solid black",
								borderRadius: "5px",
								width: "100%",
								margin: "10px auto 0 auto",
								borderColor: initialStateFormatError.length > 0 ? "red" : "",
								transition: "border-color .1s ease-in-out",
							}}
						/>
						{initialStateFormatError.length > 0 && <p className="error">{initialStateFormatError}</p>}
					</label>
					<label>
						Fix point iteration limit (empty for infinite):
						<input className={isNaN(iterationLimit) ? "warning" : ""} placeholder="inf" type="number" value={isNaN(iterationLimit) ? "" : iterationLimit} onChange={(e) => setIterationLimit(parseInt(e.target.value))} />
						{isNaN(iterationLimit) && <p>Page might freeze due to the infinite fixed point search.</p>}
					</label>
					<input id="first-assignment-button" type="submit" value="RUN" />
					<button type="button" className="secondary" onClick={_clearResult}>
						CLEAR
					</button>
				</form>
				{initialStateResult.size() > 0 && (
					<div className="result">
						<h4>Results</h4>
						<h5>Input data</h5>
						<pre aria-label="Initial state:">{initialStateResult.toString().replace(/ /g, "\u00A0")}</pre>
						<p aria-label="Token list:">{tokenList.length > 0 ? tokenList.toString() : "[ ]"}</p>
						<pre aria-label="AST:">{prettyPrintStatement(programStatement, 3)}</pre>
						<h5>Output data</h5>
						<p aria-label="Evaluation result:">{evaluationResult.toString()}</p>
					</div>
				)}
			</div>
		</div>
	);
};
export default FirstAssignment;
