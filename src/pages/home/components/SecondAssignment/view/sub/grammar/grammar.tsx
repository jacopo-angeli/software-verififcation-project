import Latex from "react-latex-next";
import "./grammar.css";

const Grammar = () => {
	return (
		<div className="grammar">
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
	);
};
export default Grammar;
