import {
	VoidObj,
	Expr,
	Id,
	FuncDecl,
	StringLiteral,
	FuncCall,
	ArrayAccess,
	NumberLiteral,
} from "../ast/exprs.js";
import * as MATH from "../ast/math.js";
import {
	Program,
	ReturnStatement,
	ExprAsStatement,
	AssignmentStatement,
	DeclarationAndAssignmentStatement,
	DeclarationStatement,
	CommentStatement,
	PrintStatement,
	PrettyPrintStatement,
	IfStmt,
	WhileLoop,
	ForLoop,
	Statement,
} from "../ast/stmts.js";
import { FunctionType, ProductType, TypeAST } from "../ast/type.js";
import { Token } from "./token.js";
import { Tokenizer } from "./tokenizer.js";

export class Parser {
	input: string;
	scan: Tokenizer;
	root: Program;
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
	program(): Program {
		let stmts: Statement[] = [];

		while (this.current() != "EOF") {
			stmts.push(this.stmt());
		}
		this.match("EOF");
		return new Program(stmts);
	}

	// stmts -> { stmt* }
	stmts(): Statement[] {
		let stmts: Statement[] = [];

		this.match("{");
		while (this.current() != "}") {
			stmts.push(this.stmt());
		}
		this.match("}");
		return stmts;
	}

	stmt(): Statement {
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

		let ret = this.semicolonStmt();
		this.match(";");
		return ret;
	}

	semicolonStmt(): Statement {
		if (this.current(1) == "ID" && this.current(2) == ":")
			return this.varDecl();

		if (this.current() == "return") {
			this.match("return");
			if (this.current() == ";")
				return new ReturnStatement(new VoidObj());
			let expr = this.expr();
			return new ReturnStatement(expr);
		}

		let lhs: Expr = this.expr();
		if (this.current() == ";") {
			return new ExprAsStatement(lhs);
		}
		let id: Id = lhs as Id; //TODO sucks
		let expr: Expr;
		switch (this.current()) {
			case "=":
				this.match("=");
				expr = this.expr();
				return new AssignmentStatement(id, expr);
			case "+=":
				this.match("+=");
				expr = this.expr();
				return new AssignmentStatement(id, new MATH.Add([id, expr]));

			case "-=":
				this.match("-=");
				expr = this.expr();
				return new AssignmentStatement(id, new MATH.Sub([id, expr]));

			case "*=":
				this.match("*=");
				expr = this.expr();
				return new AssignmentStatement(id, new MATH.Mul([id, expr]));

			default:
				this.match("/=");
				expr = this.expr();
				return new AssignmentStatement(id, new MATH.Div([id, expr]));
		}

		//expr = this.expr();
		//return new ExprAsStatement(expr);
	}

	varDecl(): Statement {
		let idName: Id = this.id(); // TODO token replacement
		this.match(":");
		let type: TypeAST = this.type();

		if (this.current() == "=") {
			this.match("=");
			let expr = this.expr();
			return new DeclarationAndAssignmentStatement(idName, type, expr);
		}

		return new DeclarationStatement(idName, type);
	}

	funcDecl(): Statement {
		let id: Id = this.id();
		this.match("(");

		//TODO add optional parameters
		let params: DeclarationStatement[] = [];
		while (this.current() != ")") {
			params.push(this.varDecl() as DeclarationStatement);
		}

		let domainTypes: TypeAST[] = params.map((x) => x.type);
		let domain: TypeAST;
		if (domainTypes.length == 0) domain = new TypeAST("void");
		else if (domainTypes.length == 1) domain = domainTypes[0];
		else domain = new ProductType(domainTypes);

		this.match(")");
		this.match(":");
		let codomain: TypeAST = this.type();

		let funcType: FunctionType = new FunctionType(domain, codomain);

		if (this.current() == "=") this.match("=");

		let stmts: Statement[] = this.stmts();

		return new DeclarationAndAssignmentStatement(
			id,
			funcType,
			new FuncDecl(params, stmts, funcType)
		);
	}

	commentStmt(): Statement {
		let mat: Token = this.match("COM");
		let str = mat.value;
		if (str.substring(0, 2) == "//") str = str.substring(2);
		else if (str.substring(0, 2) == "/*")
			str = str.substring(2, str.length - 2);
		str = str.trim();
		return new CommentStatement(str);
	}

	printStmt(): Statement {
		if (this.current() == "print") {
			this.match("print");
			let ret: Statement = new PrintStatement(this.expr());
			this.match(";");
			return ret;
		}
		if (this.current() == "pprint") {
			this.match("pprint");
			let ret: Statement = new PrettyPrintStatement(this.expr());
			this.match(";");
			return ret;
		}
		if (this.current() == "println") {
			this.match("println");
			let ret: Statement = new PrintStatement(this.expr(), true);
			this.match(";");
			return ret;
		}

		this.match("pprintln");
		let ret: Statement = new PrettyPrintStatement(this.expr(), true);
		this.match(";");
		return ret;
	}

	ifStmt(): IfStmt {
		this.match("if");
		let test: Expr = this.expr();
		let stmts: Statement[] = [];
		let elseStmts: Statement[] = [];

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

		return new IfStmt(test, stmts, elseStmts);
	}

	whileLoop(): WhileLoop {
		this.match("while");
		let test: Expr = this.expr();
		let stmts: Statement[] = [];
		if (this.current() == "{") {
			stmts = this.stmts();
		} else {
			stmts = [this.stmt()];
		}
		return new WhileLoop(test, stmts);
	}

	forLoop(): ForLoop {
		this.match("for");
		let hasParens: boolean = this.current() == "(";

		if (hasParens) this.match("(");

		let asg: Statement = this.semicolonStmt();
		this.match(";");
		let test: Expr = this.expr();
		this.match(";");
		let it: Statement = this.semicolonStmt();

		if (hasParens) this.match(")");
		let stmts: Statement[] = [];

		if (this.current() == "{") {
			stmts = this.stmts();
		} else {
			stmts = [this.stmt()];
		}
		return new ForLoop([asg], test, [it], stmts);
	}

	str(): StringLiteral {
		let val: string = this.match("STR").value;
		return new StringLiteral(val.substring(1, val.length - 1));
	}

	exprs(): Expr[] {
		let exprs: Expr[] = [this.expr()];
		while (this.current() == ",") {
			this.match(",");
			exprs.push(this.expr());
		}
		return exprs;
	}

	expr(): Expr {
		return this.boolOr();
	}

	boolOr(): Expr {
		let left = this.boolAnd();
		while (["||", "or"].includes(this.current())) {
			this.match(this.current());

			let right = this.boolAnd();
			left = new MATH.LogicalOr([left, right]);
		}
		return left;
	}

	boolAnd(): Expr {
		let left = this.boolEq();
		while (["&&", "and"].includes(this.current())) {
			this.match(this.current());

			let right = this.boolEq();
			left = new MATH.LogicalAnd([left, right]);
		}
		return left;
	}

	boolEq(): Expr {
		let left = this.boolNeq();
		while (this.current() == "==") {
			this.match("==");

			let right = this.boolNeq();
			left = new MATH.LogicalEq([left, right]);
		}
		return left;
	}

	boolNeq(): Expr {
		let left = this.boolNeg();
		while (this.current() == "~=") {
			this.match("~=");

			let right = this.boolNeg();
			left = new MATH.LogicalNot([new MATH.LogicalEq([left, right])]);
		}
		return left;
	}

	boolNeg(): Expr {
		if (this.current() == "~") {
			this.match("~");
			return new MATH.LogicalNot([this.boolNeg()]);
		}
		return this.additive();
	}

	additive(): Expr {
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

	multiplicative(): Expr {
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

	negation(): Expr {
		if (this.current() == "-") {
			this.match("-");
			return new MATH.Negate(this.negation());
		}
		return this.exponent();
	}

	exponent(): Expr {
		let childs: Expr[] = [this.factorial()];
		while (this.current() == "^") {
			this.match("^");
			childs.push(this.factorial());
		}

		let right: Expr = childs[childs.length - 1];
		for (let i = childs.length - 2; i >= 0; i--) {
			let left: Expr = childs[i];
			right = new MATH.Exponent(left, right);
		}
		return right;
	}

	factorial(): Expr {
		let child: Expr = this.funcCall();
		while (this.current() == "!") {
			this.match("!");
			child = new MATH.Factorial(child);
		}
		return child;
	}

	funcCall(): Expr {
		let left: Expr = this.primary();
		while (["(", "["].includes(this.current())) {
			if (this.current() == "(") {
				this.match("(");
				let exprs: Expr[] = this.current() == ")" ? [] : this.exprs();
				this.match(")");
				left = new FuncCall(left, exprs);
			} else {
				this.match("[");
				let expr: Expr = this.expr();
				this.match("]");
				left = new ArrayAccess(left, expr);
			}
		}
		return left;
	}

	primary(): Expr {
		if (this.current() == "NUM") return this.num();
		if (this.current() == "ID") return this.id();
		if (this.current() == "STR") return this.str();
		this.match("(");
		let ret: Expr = this.expr();
		this.match(")");
		return ret;
	}

	type(): TypeAST {
		return this.typeFunctional();
	}

	typeFunctional(): TypeAST {
		let childs: TypeAST[] = [this.typeMultiplicative()];
		while (this.current() == "->") {
			this.match("->");
			childs.push(this.typeMultiplicative());
		}

		let right: TypeAST = childs[childs.length - 1];
		for (let i = childs.length - 2; i >= 0; i--) {
			let left: TypeAST = childs[i];
			right = new FunctionType(left, right);
		}
		return right;
	}

	typeMultiplicative(): TypeAST {
		//TODO
		if (this.current() == "(") {
			this.match("(");
			let ret = this.type();
			this.match(")");
			return ret;
		}
		return this.typePrimary();
	}

	typePrimary(): TypeAST {
		let tok: Token = this.match(this.current());
		return new TypeAST(tok.value);
	}

	id(): Id {
		let token: Token = this.match("ID");
		return new Id(token.value);
	}

	num(): NumberLiteral {
		let token: Token = this.match("NUM");
		return new NumberLiteral(token.value);
	}
}
