import { ArithmeticBinaryOperator, ArithmeticExpression, DecrementOperator, IncrementOperator, ArithmeticUnaryOperator, Numeral, Variable } from "../model/while+/arithmetic_expression";
import { BooleanBinaryOperator, BooleanExpression, BooleanUnaryOperator, Boolean } from "../model/while+/boolean_expression";
import { Assignment, Concatenation, ForLoop, IfThenElse, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../model/while+/statement";

// Helper function for indentation
function indent(level: number): string {
  return ' '.repeat(level * 2);
}

// Pretty printer function for ArithmeticExpression
function prettyPrintExpr(expr: ArithmeticExpression, level: number = 0): string {
  if (expr instanceof Numeral) {
    return `${indent(level)}Numeral: ${expr.value}`;
  } else if (expr instanceof Variable) {
    return `${indent(level)}Variable: ${expr.name}`;
  } else if (expr instanceof ArithmeticBinaryOperator) {
    return `${indent(level)}BinaryOperator: ${expr.operator.value}\n${prettyPrintExpr(expr.leftOperand, level + 1)}\n${prettyPrintExpr(expr.rightOperand, level + 1)}`;
  } else if (expr instanceof ArithmeticUnaryOperator) {
    return `${indent(level)}UnaryOperator: ${expr.operator.value}\n${prettyPrintExpr(expr.operand, level + 1)}`;
  } else if (expr instanceof IncrementOperator) {
    return `${indent(level)}IncrementOperator:\n${indent(level + 1)}Variable: ${expr.variable.toString()}\n${indent(level + 1)}`;
  } else if (expr instanceof DecrementOperator) {
    return `${indent(level)}DecrementOperator:\n${indent(level + 1)}Variable: ${expr.variable.toString()}\n${indent(level + 1)}`;
  } else {
    throw new Error(`AST printing: ${expr} Not an arithmentic expression.`);
  }
}

// Pretty printer function for BooleanExpression
function prettyPrintBoolean(expr: BooleanExpression, level: number = 0): string {
  if (expr instanceof Boolean) {
    return `${indent(level)}Boolean: ${expr.value}`;
  } else if (expr instanceof BooleanBinaryOperator) {
    if (expr.concatenation()) {
      return `${indent(level)}BinaryOperator: ${expr.operator.value}\n${prettyPrintExpr(expr.leftOperand as ArithmeticExpression, level + 1)}\n${prettyPrintExpr(expr.rightOperand as ArithmeticExpression, level + 1)}`;
    } else {
      return `${indent(level)}BooleanConcatenation: ${expr.operator.value}\n${prettyPrintBoolean(expr.leftOperand as BooleanExpression, level + 1)}\n${prettyPrintBoolean(expr.rightOperand as BooleanExpression, level + 1)}`;
    }
  } else if (expr instanceof BooleanUnaryOperator) {
    return `${indent(level)}UnaryOperation: ${expr.operator.value}\n${prettyPrintBoolean(expr.booleanExpression, level + 1)}`;
  } else {
    throw new Error(`AST printing: ${expr} Not a boolean expression.`);
  }
}

// Pretty printer function for Statements
function prettyPrintStatement(statement: Statement, level: number = 0): string {
  if (statement instanceof Assignment) {
    return `${indent(level)}Assignment:\n${indent(level + 1)}Variable: ${statement.variable.toString()}\n${indent(level + 1)}Value:\n${prettyPrintExpr(statement.value, level + 2)}`;
  } else if (statement instanceof Skip) {
    return `${indent(level)}Skip`;
  } else if (statement instanceof Concatenation) {
    return `${indent(level)}Concatenation:\n${prettyPrintStatement(statement.f, level + 1)}\n${prettyPrintStatement(statement.g, level + 1)}`;
  } else if (statement instanceof IfThenElse) {
    return `${indent(level)}IfThenElse:\n${indent(level + 1)}Guard:\n${prettyPrintBoolean(statement.guard, level + 2)}\n${indent(level + 1)}Then:\n${prettyPrintStatement(statement.thenB, level + 2)}\n${indent(level + 1)}Else:\n${prettyPrintStatement(statement.elseB, level + 2)}`;
  } else if (statement instanceof WhileLoop) {
    return `${indent(level)}WhileLoop:\n${indent(level + 1)}Guard:\n${prettyPrintBoolean(statement.guard, level + 2)}\n${indent(level + 1)}Body:\n${prettyPrintStatement(statement.body, level + 2)}`;
  } else if (statement instanceof RepeatUntilLoop) {
    return `${indent(level)}RepeatUntilLoop:\n${indent(level + 1)}Guard:\n${prettyPrintBoolean(statement.guard, level + 2)}\n${indent(level + 1)}Body:\n${prettyPrintStatement(statement.body, level + 2)}`;
  } else if (statement instanceof ForLoop) {
    return `${indent(level)}ForLoop:\n${indent(level + 1)}Initial:\n${prettyPrintStatement(statement.initialStatement, level + 2)}\n${indent(level + 1)}Guard:\n${prettyPrintBoolean(statement.guard, level + 2)}\n${indent(level + 1)}Increment:\n${prettyPrintStatement(statement.incrementStatement, level + 2)}\n${indent(level + 1)}Body:\n${prettyPrintStatement(statement.body, level + 2)}`;
  } else {
    throw new Error(`AST printing: ${statement} Not a statement.`);
  }
}

export default prettyPrintStatement;