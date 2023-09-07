import { IOBuffer } from "../IOBuffer.js";
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
import { FunctionType, ProductType, TypeAST, TypeString } from "../ast/type.js";
import { ParserError } from "../error.js";
import { unionSpan } from "../utils.js";
import { Span, Token } from "./token.js";
import { Tokenizer } from "./tokenizer.js";

export class Parser {
	input: string;
	scan: Tokenizer;
	root: Program;
	buffer: IOBuffer;

	constructor(input: string, buffer: IOBuffer) {
		this.input = input;
		this.scan = new Tokenizer(input, buffer);
		this.buffer = buffer;
		this.root = this.program();
	}

	current(n?: number): string {
		return this.scan.peek(n).kind;
	}

	match(kind: string): Token {
		if (kind == this.current()) return this.scan.pop();

		this.error(kind);
		return this.scan.peek();
	}

	error(kind: string) {
		this.buffer.throwError(
			new ParserError(kind, this.current(), this.scan.peek().span)
		);
	}

	// program -> stmt*
	program(): Program {
		let stmts: Statement[] = [];

		while (this.current() != "EOF") {
			stmts.push(this.stmt());
		}
		this.match("EOF");
		return new Program(stmts, unionSpan(stmts.map((s) => s.span)));
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
			let tok: Token = this.match("return");
			if (this.current() == ";")
				return new ReturnStatement(new VoidObj(), tok.span);
			let expr = this.expr();
			return new ReturnStatement(expr, unionSpan([tok.span, expr.span]));
		}

		let lhs: Expr = this.expr();
		if (this.current() == ";") {
			return new ExprAsStatement(lhs, lhs.span);
		}
		let id: Id = lhs as Id; //TODO sucks
		let expr: Expr;
		switch (this.current()) {
			case "=":
				this.match("=");
				expr = this.expr();
				return new AssignmentStatement(
					id,
					expr,
					unionSpan([id.span, expr.span])
				);
			case "+=":
				this.match("+=");
				expr = this.expr();
				return new AssignmentStatement(
					id,
					new MATH.Add([id, expr], unionSpan([id.span, expr.span])),
					unionSpan([id.span, expr.span])
				);

			case "-=":
				this.match("-=");
				expr = this.expr();
				return new AssignmentStatement(
					id,
					new MATH.Sub([id, expr], unionSpan([id.span, expr.span])),
					unionSpan([id.span, expr.span])
				);

			case "*=":
				this.match("*=");
				expr = this.expr();
				return new AssignmentStatement(
					id,
					new MATH.Mul([id, expr], unionSpan([id.span, expr.span])),
					unionSpan([id.span, expr.span])
				);

			default:
				this.match("/=");
				expr = this.expr();
				return new AssignmentStatement(
					id,
					new MATH.Div([id, expr], unionSpan([id.span, expr.span])),
					unionSpan([id.span, expr.span])
				);
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
			return new DeclarationAndAssignmentStatement(
				idName,
				type,
				expr,
				unionSpan([idName.span, type.span, expr.span])
			);
		}

		return new DeclarationStatement(
			idName,
			type,
			unionSpan([idName.span, type.span])
		);
	}

	funcDecl(): Statement {
		let id: Id = this.id();
		this.match("(");

		//TODO add optional parameters
		let params: DeclarationStatement[] = [];
		while (this.current() != ")") {
			params.push(this.varDecl() as DeclarationStatement);
			if (this.current() == ",") this.match(",");
		}

		let endPar: Token = this.match(")");
		this.match(":");

		let domainTypes: TypeAST[] = params.map((x) => x.type);
		let domain: TypeAST;
		if (domainTypes.length == 0) domain = new TypeAST("void", endPar.span);
		else if (domainTypes.length == 1) domain = domainTypes[0];
		else
			domain = new ProductType(
				domainTypes,
				unionSpan(domainTypes.map((t) => t.span))
			);

		let codomain: TypeAST = this.type();

		let funcType: FunctionType = new FunctionType(
			domain,
			codomain,
			unionSpan([domain.span, codomain.span])
		);

		if (this.current() == "=") this.match("=");

		let stmts: Statement[] = this.stmts();

		let span1: Span[] = params.map((p) => p.span);
		let span2: Span[] = stmts.map((p) => p.span);

		return new DeclarationAndAssignmentStatement(
			id,
			funcType,
			new FuncDecl(
				params,
				stmts,
				funcType,
				unionSpan(span1.concat(span2))
			),
			unionSpan([id.span].concat(span2))
		);
	}

	commentStmt(): Statement {
		let mat: Token = this.match("COM");
		let str = mat.value;
		if (str.substring(0, 2) == "//") str = str.substring(2);
		else if (str.substring(0, 2) == "/*")
			str = str.substring(2, str.length - 2);
		str = str.trim();
		return new CommentStatement(str, mat.span);
	}

	printStmt(): Statement {
		if (this.current() == "print") {
			let start: Token = this.match("print");
			let expr: Expr = this.expr();
			let ret: Statement = new PrintStatement(
				expr,
				unionSpan([start.span, expr.span])
			);
			this.match(";");
			return ret;
		}
		if (this.current() == "pprint") {
			let start: Token = this.match("pprint");
			let expr: Expr = this.expr();
			let ret: Statement = new PrettyPrintStatement(
				expr,
				unionSpan([start.span, expr.span])
			);
			this.match(";");
			return ret;
		}
		if (this.current() == "println") {
			let start: Token = this.match("println");
			let expr: Expr = this.expr();
			let ret: Statement = new PrintStatement(
				expr,
				unionSpan([start.span, expr.span]),
				true
			);
			this.match(";");
			return ret;
		}

		let start: Token = this.match("pprintln");
		let expr: Expr = this.expr();
		let ret: Statement = new PrettyPrintStatement(
			expr,
			unionSpan([start.span, expr.span]),
			true
		);
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

		let span1: Span[] = [test.span];
		let span2: Span[] = stmts.map((s) => s.span);
		let span3: Span[] = elseStmts.map((s) => s.span);

		return new IfStmt(
			test,
			stmts,
			elseStmts,
			unionSpan(span1.concat(span2).concat(span3))
		);
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
		let span1: Span[] = [test.span];
		let span2: Span[] = stmts.map((s) => s.span);
		return new WhileLoop(test, stmts, unionSpan(span1.concat(span2)));
	}

	forLoop(): ForLoop {
		let start: Token = this.match("for");
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
		return new ForLoop(
			[asg],
			test,
			[it],
			stmts,
			unionSpan([start.span].concat(stmts.map((s) => s.span)))
		);
	}

	str(): StringLiteral {
		let tok: Token = this.match("STR");
		let val: string = tok.value;
		return new StringLiteral(val.substring(1, val.length - 1), tok.span);
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
			left = new MATH.LogicalOr(
				[left, right],
				unionSpan([left.span, right.span])
			);
		}
		return left;
	}

	boolAnd(): Expr {
		let left = this.boolEq();
		while (["&&", "and"].includes(this.current())) {
			this.match(this.current());

			let right = this.boolEq();
			left = new MATH.LogicalAnd(
				[left, right],
				unionSpan([left.span, right.span])
			);
		}
		return left;
	}

	boolEq(): Expr {
		let left = this.boolNeq();
		while (this.current() == "==") {
			this.match("==");

			let right = this.boolNeq();
			left = new MATH.LogicalEq(
				[left, right],
				unionSpan([left.span, right.span])
			);
		}
		return left;
	}

	boolNeq(): Expr {
		let left = this.boolNeg();
		while (this.current() == "~=") {
			this.match("~=");

			let right = this.boolNeg();
			left = new MATH.LogicalNot(
				[
					new MATH.LogicalEq(
						[left, right],
						unionSpan([left.span, right.span])
					),
				],
				unionSpan([left.span, right.span])
			);
		}
		return left;
	}

	boolNeg(): Expr {
		if (this.current() == "~") {
			let tok: Token = this.match("~");

			let ins: Expr = this.boolNeg();

			return new MATH.LogicalNot([ins], unionSpan([tok.span, ins.span]));
		}
		return this.additive();
	}

	additive(): Expr {
		let left = this.multiplicative();
		while (["+", "-"].includes(this.current())) {
			if (this.current() == "+") {
				this.match("+");
				let right = this.multiplicative();
				left = new MATH.Add(
					[left, right],
					unionSpan([left.span, right.span])
				);
			} else if (this.current() == "-") {
				this.match("-");
				let right = this.multiplicative();
				left = new MATH.Sub(
					[left, right],
					unionSpan([left.span, right.span])
				);
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
				left = new MATH.Mul(
					[left, right],
					unionSpan([left.span, right.span])
				);
			} else if (this.current() == "/") {
				this.match("/");
				let right = this.negation();
				left = new MATH.Div(
					[left, right],
					unionSpan([left.span, right.span])
				);
			}
		}
		return left;
	}

	negation(): Expr {
		if (this.current() == "-") {
			let tok: Token = this.match("-");
			let ins: Expr = this.negation();
			return new MATH.Negate(ins, unionSpan([tok.span, ins.span]));
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
			right = new MATH.Exponent(
				left,
				right,
				unionSpan([left.span, right.span])
			);
		}
		return right;
	}

	factorial(): Expr {
		let child: Expr = this.funcCall();
		while (this.current() == "!") {
			let tok: Token = this.match("!");
			child = new MATH.Factorial(
				child,
				unionSpan([tok.span, child.span])
			);
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

				left = new FuncCall(
					left,
					exprs,
					unionSpan([left.span].concat(exprs.map((e) => e.span)))
				);
			} else {
				this.match("[");
				let expr: Expr = this.expr();
				let endTok: Token = this.match("]");
				left = new ArrayAccess(
					left,
					expr,
					unionSpan([left.span, endTok.span])
				);
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
			right = new FunctionType(
				left,
				right,
				unionSpan([left.span, right.span])
			);
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

		// TODO sucky type conversion
		return new TypeAST(tok.value as TypeString, tok.span);
	}

	id(): Id {
		let token: Token = this.match("ID");
		return new Id(token.value, token.span);
	}

	num(): NumberLiteral {
		let token: Token = this.match("NUM");
		return new NumberLiteral(token.value, token.span);
	}
}
