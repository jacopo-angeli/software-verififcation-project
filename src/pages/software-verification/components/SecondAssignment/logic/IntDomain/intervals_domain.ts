import { Interval, IntervalFactory } from "./interval_factory";
import { ArithmeticBinaryOperator, ArithmeticUnaryOperator, ArithmeticExpression, Numeral, Variable } from "../../../../model/while+/arithmetic_expression";
import { BooleanExpression, Boolean, BooleanBinaryOperator, BooleanUnaryOperator, BooleanConcatenation } from "../../../../model/while+/boolean_expression";
import { AbstractProgramState } from "../../model/abstract_program_state";
import { Assignment, Concatenation, DecrementOperator, ForLoop, IfThenElse, IncrementOperator, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../../../../model/while+/statement";
import { Token, TokenType } from "../../../../model/token";
import { AbstractDomain } from "../../model/abstract_domain";

export class IntervalDomain extends AbstractDomain<Interval> {

    constructor(protected intervalFactory: IntervalFactory, protected _widening: boolean, protected _narrowing: boolean) { super() }

    // ORDERING ---------------------------------------------------------------------------------------------
    protected equals(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a) && this.intervalFactory.isBottom(b)) return true;
        if (this.intervalFactory.isTop(a) && this.intervalFactory.isTop(b)) return true;
        return a.lower === b.lower && a.upper === b.upper;
    }

    protected notEquals(a: Interval, b: Interval): boolean {
        return !this.equals(a, b);
    }

    protected lessThan(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a)) return !(this.intervalFactory.isBottom(b));
        if (this.intervalFactory.isBottom(b)) return false;

        // top < v
        // v.isBottom()    => false
        // v.isTop()       => false
        // v anything else => false
        if (this.intervalFactory.isTop(a)) return false;

        // v < top
        // v.isBottom()    => true
        // v.isTop()       => false
        // v anything else => true
        if (this.intervalFactory.isTop(b)) {
            if (this.intervalFactory.isTop(a)) return false;
            return true;
        }

        return a.upper < b.lower;
    }

    protected lessThanOrEqual(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a)) return true;
        if (this.intervalFactory.isTop(a)) return this.intervalFactory.isTop(b);
        if (this.intervalFactory.isTop(b)) return true;
        if (this.intervalFactory.isBottom(b)) return false;
        return a.upper <= b.lower;
    }

    protected greaterThan(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a)) return false;
        if (this.intervalFactory.isTop(a)) return !(this.intervalFactory.isTop(b));
        if (this.intervalFactory.isTop(b)) return false;
        if (this.intervalFactory.isBottom(b)) return true;

        return a.lower > b.upper;

    }

    protected greaterThanOrEqual(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a)) {
            return this.intervalFactory.isBottom(b);
        }
        if (this.intervalFactory.isTop(a)) {
            return true;
        }
        if (this.intervalFactory.isTop(b)) {
            return false;
        }
        if (this.intervalFactory.isBottom(b)) {
            return true;
        }
        if (a instanceof Interval && b instanceof Interval) {
            return a.lower >= b.upper;
        }
        return false;
    }
    // ------------------------------------------------------------------------------------------------------


    // GLB-LUB ----------------------------------------------------------------------------------------------
    private lubOfIntervals(a: Interval, b: Interval): Interval {
        if (this.intervalFactory.isBottom(a)) return b;
        if (this.intervalFactory.isBottom(b)) return a;
        if (this.intervalFactory.isTop(a) || this.intervalFactory.isTop(b)) return this.intervalFactory.Top;
        const lower = Math.min(a.lower, b.lower);
        const upper = Math.max(a.upper, b.upper);
        return this.intervalFactory.getInterval(lower, upper);
    }
    protected lub(states: Array<AbstractProgramState>): AbstractProgramState {

        if (states.length === 0) return AbstractProgramState.empty();

        const lubState = new AbstractProgramState();
        const allKeys = new Set<string>();

        // Collect all keys
        states.forEach(state => {
            for (var v of state.variables()) {
                allKeys.add(v);
            }
        });

        // Compute the lub for each key
        allKeys.forEach(key => {
            let lub: Interval | null = null;
            states.forEach(state => {
                if (state.has(key)) {
                    const interval = state.get(key);
                    lub = lub === null ? interval : this.lubOfIntervals(lub, interval);
                }
            });
            if (lub !== null) {
                lubState.set(key, lub as Interval, true); // Assuming lub is always an Interval
            }
        });


        return lubState;
    }
    private glbOfIntervals = (a: Interval, b: Interval): Interval => {
        if (this.intervalFactory.isTop(a)) return b;
        if (this.intervalFactory.isTop(b)) return a;
        if (this.intervalFactory.isBottom(a) || this.intervalFactory.isBottom(b)) return this.intervalFactory.Bottom;
        const lower = Math.max(a.lower, b.lower);
        const upper = Math.min(a.upper, b.upper);
        if (lower <= upper) {
            return this.intervalFactory.getInterval(lower, upper);
        } else {
            return this.intervalFactory.Bottom;
        }
    }
    protected glb(states: Array<AbstractProgramState>): AbstractProgramState {


        if (states.length === 0) return AbstractProgramState.empty();

        const glbState = new AbstractProgramState();
        const allKeys = new Set<string>();

        // Collect all keys
        states.forEach(state => {
            for (var v of state.variables()) {
                allKeys.add(v);
            }
        });

        // Compute the glb for each key
        allKeys.forEach(key => {
            let glb: Interval | null = null;
            states.forEach(state => {
                if (state.has(key)) {
                    const interval = state.get(key) as Interval;
                    glb = glb === null ? interval : this.glbOfIntervals(glb, interval);
                }
            });
            if (glb !== null) {
                glbState.set(key, glb as Interval, true); // Assuming glb is always an Interval
            }
        });

        return glbState;
    }
    // ------------------------------------------------------------------------------------------------------

    // WIDENING-NARROWING -----------------------------------------------------------------------------------
    protected widening(i1: Interval, i2: Interval): Interval {
        if (this.intervalFactory.isBottom(i1)) return i2;
        if (this.intervalFactory.isBottom(i2)) return i1;
        if (this.intervalFactory.isTop(i1) || this.intervalFactory.isTop(i2)) return this.intervalFactory.Top;
        const newLower = (i1.lower <= i2.lower) ? i1.lower : this.intervalFactory.getMin;
        const newUpper = (i1.upper >= i2.upper) ? i1.upper : this.intervalFactory.getMax;
        // const newLower = (i1.lower <= i2.lower) ? i1.lower : (i2.lower >= 0 && i2.lower < i1.lower) ? 0 : this.intervalFactory.getMin;
        // const newUpper = (i1.upper >= i2.upper) ? i1.upper : (i1.upper <= 0 && i1.upper > i2.upper) ? 0 : this.intervalFactory.getMax;
        let ret = this.intervalFactory.getInterval(newLower, newUpper);
        return ret;
    }
    protected abstract_state_widening(a1: AbstractProgramState, a2: AbstractProgramState): AbstractProgramState {
        console.log("Widening | inputs:", a1.toString(), a2.toString())
        let widenedState = new AbstractProgramState();

        // Process variables in the previous state (a1)
        a1.variables().forEach((variable) => {
            if (a2.has(variable)) {
                // Get the intervals for the common variable
                let prevInterval = a1.get(variable);
                let currentInterval = a2.get(variable);
                // Apply the widening operator
                let widenedInterval = this.widening(prevInterval, currentInterval);
                // Set the widened interval in the new state
                widenedState.set(variable, widenedInterval, true);
            } else {
                // Keep the variable from a1 if it's not in a2
                widenedState.set(variable, a1.get(variable), true);
            }
        });

        // Process variables in the current state (a2) that are not in a1
        a2.variables().forEach((variable) => {
            if (!a1.has(variable)) {
                // Keep the variable from a2 if it's not in a1
                widenedState.set(variable, a2.get(variable), true);
            }
        });

        // Return the new widened state
        return widenedState;
    }
    protected narrowing(i1: Interval, i2: Interval): Interval {
        if (this.intervalFactory.isBottom(i1)) return i2;
        if (this.intervalFactory.isBottom(i2)) return i1;
        const newLower = this.intervalFactory.getMin >= i1.lower ? i2.lower : i1.lower;
        const newUpper = this.intervalFactory.getMax <= i1.upper ? i2.upper : i1.upper;
        return this.intervalFactory.getInterval(newLower, newUpper);
    }
    protected abstract_state_narrowing(a1: AbstractProgramState, a2: AbstractProgramState): AbstractProgramState {
        let narrowedState = new AbstractProgramState();

        // Process variables in the previous state (a1)
        a1.variables().forEach((variable) => {
            if (a2.has(variable)) {
                // Get the intervals for the common variable
                let prevInterval = a1.get(variable);
                let currentInterval = a2.get(variable);
                // Apply the narrowing operator
                let narrowedInterval = this.narrowing(prevInterval, currentInterval);
                // Set the narrowed interval in the new state
                narrowedState.set(variable, narrowedInterval, true);
            } else {
                // Keep the variable from a1 if it's not in a2
                narrowedState.set(variable, a1.get(variable), true);
            }
        });

        // Process variables in the current state (a2) that are not in a1
        a2.variables().forEach((variable) => {
            if (!a1.has(variable)) {
                // Keep the variable from a2 if it's not in a1
                narrowedState.set(variable, a2.get(variable), true);
            }
        });

        // Return the new narrowed state
        return narrowedState;
    }
    // ------------------------------------------------------------------------------------------------------

    // ALPHA-GAMMA ------------------------------------------------------------------------------------------
    // 𝛼(X) is the least interval containing X
    public alpha(c: number): Interval {
        return this.intervalFactory.getInterval(c, c);
    };
    // ------------------------------------------------------------------------------------------------------

    // ArithmeticOp -----------------------------------------------------------------------------------------
    protected op(i1: Interval, op: string, i2: Interval): Interval {
        switch (op) {
            case "+":
                if (this.intervalFactory.isBottom(i1) || this.intervalFactory.isBottom(i2))
                    return this.intervalFactory.Bottom;
                if (this.intervalFactory.isTop(i1) || this.intervalFactory.isTop(i2))
                    return this.intervalFactory.Top;
                return this.intervalFactory.getInterval(
                    i1.lower + i2.lower,
                    i1.upper + i2.upper
                );


            case "-":
                if (this.intervalFactory.isBottom(i1) || this.intervalFactory.isBottom(i2))
                    return this.intervalFactory.Bottom;
                if (this.intervalFactory.isTop(i1) || this.intervalFactory.isTop(i2))
                    return this.intervalFactory.Top;
                return this.intervalFactory.getInterval(
                    Math.min(i1.lower - i2.lower, i1.lower - i2.upper, i1.upper - i2.lower, i1.upper - i2.upper),
                    Math.max(i1.lower - i2.lower, i1.lower - i2.upper, i1.upper - i2.lower, i1.upper - i2.upper),
                );


            case "*":
                if (this.intervalFactory.isBottom(i1) || this.intervalFactory.isBottom(i2))
                    return this.intervalFactory.Bottom;
                if (this.intervalFactory.isTop(i1) || this.intervalFactory.isTop(i2)) {
                    if (i1 instanceof Interval && i1.lower === i1.upper && i1.lower === 0)
                        return this.intervalFactory.getInterval(0, 0);
                    if (i2 instanceof Interval && i2.lower === i2.upper && i2.lower === 0)
                        return this.intervalFactory.getInterval(0, 0);
                    return this.intervalFactory.Top;
                }

                let products: Array<number> = [
                    i1.lower * i2.lower, i1.lower * i2.upper,
                    i1.upper * i2.lower, i1.upper * i2.upper
                ];
                return this.intervalFactory.getInterval(Math.min(...products), Math.max(...products));


            case "%":
                console.log("Modulo, inputs: ", i1.toString(), i2.toString());
                if (this.intervalFactory.isBottom(i1) || this.intervalFactory.isBottom(i2)) return this.intervalFactory.Bottom;
                if (this.intervalFactory.isTop(i1) || this.intervalFactory.isTop(i2)) return this.intervalFactory.Top;

                if (i2.lower === 0 && i2.upper === 0) return this.intervalFactory.Bottom;

                if (i2.lower > 0 || i2.upper < 0) {
                    return this.intervalFactory.getInterval(
                        Math.min(i1.lower % i2.lower, i1.lower % i2.upper, i1.upper % i2.lower, i1.upper % i2.upper),
                        Math.max(i1.lower % i2.lower, i1.lower % i2.upper, i1.upper % i2.lower, i1.upper % i2.upper)
                    );
                }

                return this.intervalFactory.Bottom;


            default:
                throw Error();
        }
    };
    // ------------------------------------------------------------------------------------------------------

    // A#-B#-D# ---------------------------------------------------------------------------------------------
    protected aSharp(expr: ArithmeticExpression, aState: AbstractProgramState): Interval {
        if (expr instanceof ArithmeticBinaryOperator) {
            return this.op(this.aSharp(expr.leftOperand, aState), expr.operator.value, this.aSharp(expr.rightOperand, aState));
        }
        if (expr instanceof ArithmeticUnaryOperator) {
            return this.op(this.aSharp(expr.operand, aState), "*", this.alpha(-1));
        }
        if (expr instanceof Variable) {
            return aState.get(expr.name);
        }
        if (expr instanceof Numeral) {
            return this.alpha(expr.value);
        }
        throw Error("Unknown expression type.");
    }
    protected bSharp(expr: BooleanExpression, aState: AbstractProgramState, negation: boolean = false): AbstractProgramState {
        if (expr instanceof Boolean) {
            if (expr.value === true || (expr.value === false && negation)) return aState.copy();
            else return new AbstractProgramState();
        } else if (expr instanceof BooleanBinaryOperator) {

            if (expr.leftOperand instanceof Variable) {
                let auxAState: AbstractProgramState = new AbstractProgramState();

                auxAState.set(expr.leftOperand.name, this.aSharp(expr.rightOperand, aState), true);

                switch (expr.operator.value) {
                    //  if (negation)
                    //  +----+----+----+----+----+----+----+
                    //  |  f | <  | <= |  > | >= | != | == |
                    //  +----+----+----+----+----+----+----+
                    //  |    | >= |  > | <= |  < | == | != |
                    //  +----+----+----+----+----+----+----+
                    case "!=":
                        // e.g. expr : x!=40, aState: {x:[0,30]} => {x:[0,30]}
                        if (negation) return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.EQ, "==")), aState);
                        return this.lub([aState, auxAState]);
                    case "==":
                        // e.g. expr : x==10, aState: {x:[0,30]} => {x:[10,10]}
                        if (negation) return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.INEQ, "!=")), aState);
                        return aState.copyWith(expr.leftOperand.name, this.aSharp(expr.rightOperand, aState));
                    case "<":
                        // e.g. expr : x<10, aState: {x:[0,30]} => {x: [min,9] ∩ [0,30] } 
                        if (negation) return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MOREEQ, ">=")), aState);
                        return aState.copyWith(
                            expr.leftOperand.name,
                            this.intervalFactory.intersect(
                                this.intervalFactory.getLessThan(this.aSharp(expr.rightOperand, aState).upper),
                                aState.get(expr.leftOperand.name)
                            ));
                    case "<=":
                        // e.g. expr : x<=10, aState: {x:[0,30]} => {x: [min,10] ∩ [0,30] } 
                        if (negation) return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MORE, ">")), aState);
                        return aState.copyWith(
                            expr.leftOperand.name,
                            this.intervalFactory.intersect(
                                this.intervalFactory.getLessThanOrEqual(this.aSharp(expr.rightOperand, aState).upper),
                                aState.get(expr.leftOperand.name)
                            ));;
                    case ">":
                        // e.g. expr : x>10, aState: {x:[0,30]} => {x: [10,max] ∩ [0,30] } 
                        if (negation) return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.LESSEQ, "<=")), aState);
                        return aState.copyWith(
                            expr.leftOperand.name,
                            this.intervalFactory.intersect(
                                this.intervalFactory.getMoreThan(this.aSharp(expr.rightOperand, aState).upper),
                                aState.get(expr.leftOperand.name)
                            ));
                    case ">=":
                        // e.g. expr : x>=10, aState: {x:[0,30]} => {x: [10,max] ∩ [0,30] } 
                        if (negation) return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.LESS, "<")), aState);
                        return aState.copyWith(
                            expr.leftOperand.name,
                            this.intervalFactory.intersect(
                                this.intervalFactory.getMoreThanOrEqual(this.aSharp(expr.rightOperand, aState).upper),
                                aState.get(expr.leftOperand.name)
                            ));
                    default:
                        throw Error("bSharp: Unknown boolean binary operator.");
                }
            }

            let lE: Interval = this.aSharp(expr.leftOperand, aState);
            let rE: Interval = this.aSharp(expr.rightOperand, aState);
            if (this.intervalFactory.isBottom(lE) || this.intervalFactory.isBottom(rE)) return new AbstractProgramState();

            switch (expr.operator.value) {
                //  if (negation)
                //  +----+----+----+----+----+----+----+
                //  |  f | <  | <= |  > | >= | != | == |
                //  +----+----+----+----+----+----+----+
                //  |    | >= |  > | <= |  < | == | != |
                //  +----+----+----+----+----+----+----+
                case "!=":
                    console.log("Not equals");
                    if (this.notEquals(lE, rE)) return aState.copy();
                    else return new AbstractProgramState();
                case "==":
                    if (this.equals(lE, rE)) return aState.copy();
                    else return new AbstractProgramState();
                case "<":
                    if (this.lessThan(lE, rE)) return aState.copy();
                    else return new AbstractProgramState();
                case "<=":
                    if (this.lessThanOrEqual(lE, rE)) return aState.copy();
                    else return new AbstractProgramState();
                case ">":
                    if (this.greaterThan(lE, rE)) return aState.copy();
                    else return new AbstractProgramState();
                case ">=":
                    if (this.greaterThanOrEqual(lE, rE)) return aState.copy();
                    else return new AbstractProgramState();
                default:
                    throw Error("bSharp: Unknown boolean binary operator.");
            }

        } else if (expr instanceof BooleanUnaryOperator) {
            switch (expr.operator.value) {
                case "!":
                    return this.bSharp(expr.booleanExpression, aState, !negation);
                default:
                    break;
            }
        } else if (expr instanceof BooleanConcatenation) {
            switch (expr.operator.value) {
                case '&&':
                    return this.bSharp(expr.rightOperand, this.bSharp(expr.leftOperand, aState, negation), negation);
                case '||':
                    return this.lub([this.bSharp(expr.leftOperand, aState, negation), this.bSharp(expr.rightOperand, aState, negation)]);
                default:
                    throw Error(`bSharp: Unkwnown boolean concatenation value : ${expr.operator.value}.`)
            }
        }
        throw Error("Unknown expression type.");
    }

    public dSharp(stmt: Statement, aState: AbstractProgramState): AbstractProgramState {
        if (stmt instanceof Assignment) {
            let ret: AbstractProgramState = aState.copy();
            ret.set(stmt.variable.name, this.aSharp(stmt.value, aState));
            return ret;
        }

        if (stmt instanceof Skip) {
            return aState.copy();
        }

        if (stmt instanceof Concatenation) {
            let ret = this.dSharp(stmt.secondStatement, this.dSharp(stmt.firstStatement, aState.copy()).copy());
            return ret;
        }

        if (stmt instanceof IfThenElse) {
            return this.lub([
                this.bSharp(stmt.guard, this.dSharp(stmt.thenBranch, aState.copy())),
                this.bSharp(stmt.guard, this.dSharp(stmt.elseBranch, aState.copy()), true),
            ])
        }

        if (stmt instanceof WhileLoop) {
            // Declare
            let currentState: AbstractProgramState = aState.copy();
            let prevState: AbstractProgramState;

            stmt.setPreCondition(currentState.toString());
            // Begin
            do {
                console.log("--------------------------------------------------");
                prevState = currentState;
                console.log("DSharp | previous iteration result:", prevState.toString());

                let bsharpResult = this.bSharp(stmt.guard, prevState);
                // this is the invariant that only affect the variables that are included into the stmt.guard
                console.log("DSharp | bSharp result:", bsharpResult.toString());

                console.log("BODY ---------------------------------------------");
                let dsharpResult = this.dSharp(stmt.body, bsharpResult);

                // Widening point
                if (this._widening) dsharpResult = this.abstract_state_widening(bsharpResult, dsharpResult);

                console.log("Result", (this._widening ? "(with widening):" : ":"), dsharpResult.toString());
                console.log("END ----------------------------------------------");


                // Results accumulations
                currentState = this.lub([
                    prevState,
                    dsharpResult
                ]);
                console.log("DSharp | lub Result:", currentState.toString());

                console.log("DSharp | current iteration result:", currentState.toString());

                console.log("--------------------------------------------------");
            } while (!prevState.isEqualTo(currentState));

            // Set the invariant here after the widening loop has converged
            stmt.setInvariant(currentState.toString());

            if (this._narrowing) {
                console.log("NARROWING ----------------------------------------");

                let safe: number = 0;
                do {
                    console.log("--------------------------------------------------");

                    prevState = currentState;
                    console.log("previous iteration result:", prevState.toString());

                    let bsharpResult = this.bSharp(stmt.guard, prevState);
                    console.log("DSharp | bSharp result:", bsharpResult.toString());

                    console.log("BODY ---------------------------------------------");
                    let dsharpResult = this.dSharp(stmt.body, bsharpResult);

                    currentState = this.abstract_state_narrowing(prevState, dsharpResult);
                    console.log("Narrowing result:", dsharpResult.toString());
                    console.log("END ----------------------------------------------");

                    console.log("DSharp | current iteration result:", currentState.toString());

                    console.log("--------------------------------------------------");
                } while (!prevState.isEqualTo(currentState) && safe < 100);
                console.log("END NARROWING -------------------------------------");
            }

            console.log("DSharp | Result before filtering:", currentState.toString());
            let ret = this.bSharp(stmt.guard, currentState, true);
            console.log("DSharp | Returned result after filtering:", ret.toString());

            stmt.setPostCondition(ret.toString());
            return ret;
        }

        if (stmt instanceof RepeatUntilLoop) {
            // B#[b](lfp(λx.s# ∨ S​(D#[S]∘B#[not b])x)) ∘ D#[S]s
            let currentState: AbstractProgramState = aState.copy();
            let prevState: AbstractProgramState = currentState;

            stmt.setPreCondition(currentState.toString());

            // Begin
            do {
                console.log("--------------------------------------------------");
                prevState = currentState;
                console.log("DSharp | previous iteration result:", prevState.toString());

                let bsharpResult = this.bSharp(stmt.guard, prevState, true);
                console.log("DSharp | bSharp result:", bsharpResult.toString());

                console.log("BODY ---------------------------------------------");
                let dsharpResult = this.dSharp(stmt.body, bsharpResult);

                // Widening point
                if (this._widening) dsharpResult = this.abstract_state_widening(bsharpResult, dsharpResult);

                console.log("Result", (this._widening ? "(with widening):" : ":"), dsharpResult.toString());
                console.log("END ----------------------------------------------");


                // Results accumulations
                currentState = this.lub([
                    prevState,
                    dsharpResult
                ]);
                console.log("DSharp | lub Result:", currentState.toString());

                console.log("DSharp | current iteration result:", currentState.toString());

                console.log("--------------------------------------------------");
            } while (!prevState.isEqualTo(currentState));

            stmt.setInvariant(currentState.toString());

            if (this._narrowing) {
                console.log("NARROWING ----------------------------------------");

                let safe: number = 0;
                do {
                    console.log("--------------------------------------------------");

                    prevState = currentState;
                    console.log("previous iteration result:", prevState.toString());

                    let bsharpResult = this.bSharp(stmt.guard, prevState, true);
                    console.log("DSharp | bSharp result:", bsharpResult.toString());

                    console.log("BODY ---------------------------------------------");
                    let dsharpResult = this.dSharp(stmt.body, bsharpResult);

                    currentState = this.abstract_state_narrowing(prevState, dsharpResult);
                    console.log("Narrowing result:", dsharpResult.toString());
                    console.log("END ----------------------------------------------");

                    console.log("DSharp | current iteration result:", currentState.toString());

                    console.log("--------------------------------------------------");
                } while (!prevState.isEqualTo(currentState) && safe < 100);
                console.log("END NARROWING -------------------------------------");
            }

            console.log("DSharp | Result before filtering:", currentState.toString());
            let ret = this.bSharp(stmt.guard, currentState);
            console.log("DSharp | Returned result after filtering:", ret.toString());

            stmt.setPostCondition(ret.toString());
            return ret;
        }

        if (stmt instanceof ForLoop) {
            // Initialization: Execute S
            let currentState: AbstractProgramState = this.dSharp(stmt.initialStatement, aState);
            let prevState: AbstractProgramState;

            stmt.setPreCondition(currentState.toString());

            // Begin loop processing
            do {
                console.log("--------------------------------------------------");
                prevState = currentState;
                console.log("ForLoop | previous iteration result:", prevState.toString());

                // Evaluate the guard (B)
                let bsharpResult = this.bSharp(stmt.guard, prevState);
                console.log("ForLoop | bSharp result:", bsharpResult.toString());

                // Execute the loop body (P)
                let dsharpResult = this.dSharp(stmt.body, bsharpResult);

                // Execute the update (T)
                let updatedState = this.dSharp(stmt.incrementStatement, dsharpResult);

                // Widening point
                if (this._widening) updatedState = this.abstract_state_widening(dsharpResult, updatedState);

                console.log("ForLoop Result", (this._widening ? "(with widening):" : ":"), updatedState.toString());
                console.log("END ----------------------------------------------");

                // Results accumulations
                currentState = this.lub([prevState, updatedState]);
                console.log("ForLoop | lub Result:", currentState.toString());

                console.log("ForLoop | current iteration result:", currentState.toString());

                console.log("--------------------------------------------------");
            } while (!prevState.isEqualTo(currentState));

            stmt.setInvariant(currentState.toString());

            if (this._narrowing) {
                console.log("NARROWING ----------------------------------------");
                let safe: number = 0;
                do {
                    console.log("--------------------------------------------------");

                    prevState = currentState;
                    console.log("ForLoop previous iteration result:", prevState.toString());

                    let bsharpResult = this.bSharp(stmt.guard, prevState);
                    console.log("ForLoop | bSharp result:", bsharpResult.toString());

                    let dsharpResult = this.dSharp(stmt.body, bsharpResult);

                    let updatedState = this.dSharp(stmt.incrementStatement, dsharpResult);
                    currentState = this.abstract_state_narrowing(prevState, updatedState);

                    console.log("Narrowing result:", currentState.toString());
                    console.log("END ----------------------------------------------");

                    console.log("ForLoop | current iteration result:", currentState.toString());
                    safe++;
                    console.log("--------------------------------------------------");
                } while (!prevState.isEqualTo(currentState) && safe < 100);
                console.log("END NARROWING -------------------------------------");
            }

            console.log("ForLoop | Result before filtering:", currentState.toString());
            let ret = this.bSharp(stmt.guard, currentState, true);
            console.log("ForLoop | Returned result after filtering:", ret.toString());

            stmt.setPostCondition(ret.toString());
            return ret;
        }

        if (stmt instanceof IncrementOperator) {
            let aux: AbstractProgramState = aState.copy();
            aux.set(stmt.variable.name, this.op(aState.get(stmt.variable.name), '+', this.alpha(1)));
            console.log("Increment operator result:", aux.toString());
            return aux;

        }

        if (stmt instanceof DecrementOperator) {
            let aux: AbstractProgramState = aState.copy();
            aux.set(stmt.variable.name, this.op(aState.get(stmt.variable.name), '-', this.alpha(1)));
            return aux;
        }

        throw Error("Dshapr : Unknown Statement.");
    }
    // ------------------------------------------------------------------------------------------------------

}