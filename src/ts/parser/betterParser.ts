import * as AST from "../ast/asts.js";
import * as MATH from "../ast/math.js";
import { Token } from "./token.js";
import { Tokenizer } from "./tokenizer.js";

export class Parser {
	input: string;
	scan: Tokenizer;
	root: AST.Program;
	error: boolean;

	constructor(input: string) {
		this.input = input;
		this.scan = new Tokenizer(input);
		this.root = this.program();
		this.error = false;
	}

	current(n?: number): string {
		return this.scan.peek(n).kind;
	}

	match(kind: string): Token {
		if (kind == this.current()) return this.scan.pop();

		this.error = true;
		throw new Error(
			`Expected ${kind} but saw ${this.current()} at ${
				this.scan.peek().span
			}`
		);

		//return this.scan.peek();
	}

	// program -> stmt*
	program(): AST.Program {
		let stmts: AST.Statement[] = [];

		while (this.current() != "EOF") {
			stmts.push(this.stmt());
		}
		this.match("EOF");
		return new AST.Program(stmts);
	}

	// stmts -> { stmt* }
	stmts(): AST.Statement[] {
		let stmts: AST.Statement[] = [];

		this.match("{");
		while (this.current() != "}") {
			stmts.push(this.stmt());
		}
		this.match("}");
		return stmts;
	}

	stmt(): AST.Statement {
		// removes unnecessary semicolons
		if (this.current() == ";") {
			this.match(";");
			return this.stmt();
		}

		if (
			["println", "print", "pprintln", "pprint"].includes(this.current())
		) {
			return this.printStmt();
		}

		if (this.current() == "COM") return this.commentStmt();
		if (this.current() == "if") return this.ifStmt();
		if (this.current() == "for") return this.forLoop();
		if (this.current() == "while") return this.whileLoop();

		let ret = this.semicolonStmt();
		this.match(";");
		return ret;
	}

	semicolonStmt(): AST.Statement {
		if (this.current(1) == "ID" && this.current(2) == ":")
			return this.varDecl();

		if (
			this.current(1) == "ID" &&
			this.current(2) == "(" &&
			this.current(3) == "ID" &&
			this.current(4) == ":"
		)
			return this.funcDecl();
		if (
			this.current(1) == "ID" &&
			this.current(2) == "(" &&
			this.current(3) == ")" &&
			this.current(4) == ":"
		)
			return this.funcDecl();

		if (this.current() == "return") {
			this.match("return");
			if (this.current() == ";")
				return new AST.ReturnStatement(new AST.VoidObj());
			let expr = this.expr();
			return new AST.ReturnStatement(expr);
		}

		let lhs: AST.Expr = this.expr();
		if (this.current() == ";") {
			return new AST.ExprAsStatement(lhs);
		}
		let id: AST.Id = lhs as AST.Id; //TODO sucks
		let expr: AST.Expr;
		switch (this.current()) {
			case "=":
				this.match("=");
				expr = this.expr();
				return new AST.AssignmentStatement(id, expr);
			case "+=":
				this.match("+=");
				expr = this.expr();
				return new AST.AssignmentStatement(
					id,
					new MATH.Add([id, expr])
				);

			case "-=":
				this.match("-=");
				expr = this.expr();
				return new AST.AssignmentStatement(
					id,
					new MATH.Sub([id, expr])
				);

			case "*=":
				this.match("*=");
				expr = this.expr();
				return new AST.AssignmentStatement(
					id,
					new MATH.Mul([id, expr])
				);

			default:
				this.match("/=");
				expr = this.expr();
				return new AST.AssignmentStatement(
					id,
					new MATH.Div([id, expr])
				);
		}

		//expr = this.expr();
		//return new AST.ExprAsStatement(expr);
	}

	varDecl(): AST.Statement {
		let idName: AST.Id = this.id(); // TODO token replacement
		this.match(":");
		let type: AST.TypeAST = this.type();

		if (this.current() == "=") {
			this.match("=");
			let expr = this.expr();
			return new AST.DeclarationAndAssignmentStatement(
				idName,
				type,
				expr
			);
		}

		return new AST.DeclarationStatement(idName, type);
	}

	funcDecl(): AST.Statement {
		let id: AST.Id = this.id();
		this.match("(");

		//TODO add optional parameters
		let params: AST.DeclarationStatement[] = [];
		while (this.current() != ")") {
			params.push(this.varDecl() as AST.DeclarationStatement);
		}

		this.match(":");
		let funcType: AST.TypeAST = this.type();

		if (this.current() == "=") this.match("=");

		let stmts: AST.Statement[] = this.stmts();

		return new AST.DeclarationAndAssignmentStatement(
			id,
			funcType,
			new AST.FuncDecl(params, stmts, funcType)
		);
	}

	commentStmt(): AST.Statement {
		let mat: Token = this.match("COM");
		let str = mat.value;
		if (str.substring(0, 2) == "//") str = str.substring(2);
		else if (str.substring(0, 2) == "/*")
			str = str.substring(2, str.length - 2);
		str = str.trim();
		return new AST.CommentStatement(str);
	}

	printStmt(): AST.Statement {
		if (this.current() == "print") {
			this.match("print");
			let ret: AST.Statement = new AST.PrintStatement(this.expr());
			this.match(";");
			return ret;
		}
		if (this.current() == "pprint") {
			this.match("pprint");
			let ret: AST.Statement = new AST.PrettyPrintStatement(this.expr());
			this.match(";");
			return ret;
		}
		if (this.current() == "println") {
			this.match("println");
			let ret: AST.Statement = new AST.PrintStatement(this.expr(), true);
			this.match(";");
			return ret;
		}

		this.match("pprintln");
		let ret: AST.Statement = new AST.PrettyPrintStatement(
			this.expr(),
			true
		);
		this.match(";");
		return ret;
	}

	ifStmt(): AST.IfStmt {
		this.match("if");
		let test: AST.Expr = this.expr();
		let stmts: AST.Statement[] = [];
		let elseStmts: AST.Statement[] = [];

		if (this.current() == "{") {
			stmts = this.stmts();
		} else {
			stmts = [this.stmt()];
		}

		if (this.current() == "else") {
			this.match("else");
			if (this.current() == "{") {
				elseStmts = this.stmts();
			} else {
				elseStmts = [this.stmt()];
			}
		}

		return new AST.IfStmt(test, stmts, elseStmts);
	}

	whileLoop(): AST.WhileLoop {
		this.match("while");
		let test: AST.Expr = this.expr();
		let stmts: AST.Statement[] = [];
		if (this.current() == "{") {
			stmts = this.stmts();
		} else {
			stmts = [this.stmt()];
		}
		return new AST.WhileLoop(test, stmts);
	}

	forLoop(): AST.ForLoop {
		this.match("for");
		let hasParens: boolean = this.current() == "(";

		if (hasParens) this.match("(");

		let asg: AST.Statement = this.semicolonStmt();
		this.match(";");
		let test: AST.Expr = this.expr();
		this.match(";");
		let it: AST.Statement = this.semicolonStmt();

		if (hasParens) this.match(")");
		let stmts: AST.Statement[] = [];

		if (this.current() == "{") {
			stmts = this.stmts();
		} else {
			stmts = [this.stmt()];
		}
		return new AST.ForLoop([asg], test, [it], stmts);
	}

	str(): AST.StringLiteral {
		let val: string = this.match("STR").value;
		return new AST.StringLiteral(val.substring(1, val.length - 1));
	}

	exprs(): AST.Expr[] {
		let exprs: AST.Expr[] = [this.expr()];
		while (this.current() == ",") {
			this.match(",");
			exprs.push(this.expr());
		}
		return exprs;
	}

	expr(): AST.Expr {
		return this.boolOr();
	}

	boolOr(): AST.Expr {
		let left = this.boolAnd();
		while (["||", "or"].includes(this.current())) {
			this.match(this.current());

			let right = this.boolAnd();
			left = new MATH.LogicalOr([left, right]);
		}
		return left;
	}

	boolAnd(): AST.Expr {
		let left = this.boolEq();
		while (["&&", "and"].includes(this.current())) {
			this.match(this.current());

			let right = this.boolEq();
			left = new MATH.LogicalAnd([left, right]);
		}
		return left;
	}

	boolEq(): AST.Expr {
		let left = this.boolNeq();
		while (this.current() == "==") {
			this.match("==");

			let right = this.boolNeq();
			left = new MATH.LogicalEq([left, right]);
		}
		return left;
	}

	boolNeq(): AST.Expr {
		let left = this.boolNeg();
		while (this.current() == "~=") {
			this.match("~=");

			let right = this.boolNeg();
			left = new MATH.LogicalNot([new MATH.LogicalEq([left, right])]);
		}
		return left;
	}

	boolNeg(): AST.Expr {
		if (this.current() == "~") {
			this.match("~");
			return new MATH.LogicalNot([this.boolNeg()]);
		}
		return this.additive();
	}

	additive(): AST.Expr {
		let left = this.multiplicative();
		while (["+", "-"].includes(this.current())) {
			if (this.current() == "+") {
				this.match("+");
				let right = this.multiplicative();
				left = new MATH.Add([left, right]);
			} else if (this.current() == "-") {
				this.match("-");
				let right = this.multiplicative();
				left = new MATH.Sub([left, right]);
			}
		}
		return left;
	}

	multiplicative(): AST.Expr {
		let left = this.negation();
		while (["*", "/"].includes(this.current())) {
			if (this.current() == "*") {
				this.match("*");
				let right = this.negation();
				left = new MATH.Mul([left, right]);
			} else if (this.current() == "/") {
				this.match("/");
				let right = this.negation();
				left = new MATH.Div([left, right]);
			}
		}
		return left;
	}

	negation(): AST.Expr {
		if (this.current() == "-") {
			this.match("-");
			return new MATH.Negate(this.negation());
		}
		return this.exponent();
	}

	exponent(): AST.Expr {
		let childs: AST.Expr[] = [this.factorial()];
		while (this.current() == "^") {
			this.match("^");
			childs.push(this.factorial());
		}

		let right: AST.Expr = childs[childs.length - 1];
		for (let i = childs.length - 2; i >= 0; i--) {
			let left: AST.Expr = childs[i];
			right = new MATH.Exponent(left, right);
		}
		return right;
	}

	factorial(): AST.Expr {
		let child: AST.Expr = this.funcCall();
		while (this.current() == "!") {
			this.match("!");
			child = new MATH.Factorial(child);
		}
		return child;
	}

	funcCall(): AST.Expr {
		let left: AST.Expr = this.primary();
		while (["(", "["].includes(this.current())) {
			if (this.current() == "(") {
				this.match("(");
				let exprs: AST.Expr[] =
					this.current() == ")" ? [] : this.exprs();
				this.match(")");
				left = new AST.FuncCall(left, exprs);
			} else {
				this.match("[");
				let expr: AST.Expr = this.expr();
				this.match("]");
				left = new AST.ArrayAccess(left, expr);
			}
		}
		return left;
	}

	primary(): AST.Expr {
		if (this.current() == "NUM") return this.num();
		if (this.current() == "ID") return this.id();
		if (this.current() == "STR") return this.str();
		this.match("(");
		let ret: AST.Expr = this.expr();
		this.match(")");
		return ret;
	}

	type(): AST.TypeAST {
		return this.typeFunctional();
	}

	typeFunctional(): AST.TypeAST {
		let childs: AST.TypeAST[] = [this.typeMultiplicative()];
		while (this.current() == "->") {
			this.match("->");
			childs.push(this.typeMultiplicative());
		}

		let right: AST.TypeAST = childs[childs.length - 1];
		for (let i = childs.length - 2; i >= 0; i--) {
			let left: AST.TypeAST = childs[i];
			right = new AST.FunctionType(left, right);
		}
		return right;
	}

	typeMultiplicative(): AST.TypeAST {
		//TODO
		if (this.current() == "(") {
			this.match("(");
			let ret = this.type();
			this.match(")");
			return ret;
		}
		return this.typePrimary();
	}

	typePrimary(): AST.TypeAST {
		let tok: Token = this.match(this.current());
		return new AST.TypeAST(tok.value);
	}

	id(): AST.Id {
		let token: Token = this.match("ID");
		return new AST.Id(token.value);
	}

	num(): AST.NumberLiteral {
		let token: Token = this.match("NUM");
		return new AST.NumberLiteral(token.value);
	}
}
