import { divides, gcd } from "../utils.js";
class AST {
    constructor(name, args = []) {
        this.name = name;
        this.args = args;
    }
    // deep copy of this AST
    copy() {
        let newObj = this.constructor(name);
        for (const arg of this.args)
            newObj.args.push(arg.copy());
        return newObj;
    }
    toString() {
        if (this.args.length == 0)
            return this.name + "()";
        let str = `${this.name}(${this.args[0]}`;
        for (let i = 1; i < this.args.length; i++)
            str += "," + this.args[i];
        return str + ")";
    }
    applyBind(scope, buffer) {
        for (let child of this.args) {
            child.applyBind(scope, buffer);
        }
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        for (let child of this.args) {
            child.applyType(buffer, expectedType);
        }
    }
    execute(buffer) {
        for (let child of this.args) {
            child.execute(buffer);
        }
    }
    equals(other) {
        if (this.name != other.name || this.args.length != other.args.length)
            return false;
        for (let i = 0; i < this.args.length; i++)
            if (!this.args[i].equals(other.args[i]))
                return false;
        return true;
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PROGRAM  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Program extends AST {
    constructor(stmts = []) {
        super("Program", stmts);
    }
    toLongString() {
        let str = "";
        for (let i = 0; i < this.args.length; i++) {
            str += `---\n${i}. ${this.args[i].toString()}\n`;
        }
        return str;
    }
}
class Statement extends AST {
    constructor(name, args = []) {
        super(name, args);
    }
}
export class CommentStatement extends Statement {
    constructor(str) {
        super("CommentStmt_" + str);
        this.str = str;
    }
}
export class DeclarationStatement extends Statement {
    constructor(id, type) {
        super("DeclStmt", [id, type]);
        this.id = id;
        this.type = type;
    }
    applyBind(scope, buffer) {
        let name = this.id.idName;
        if (scope.lookup(name)) {
            buffer.stderr(`id ${name} has already been defined.`);
            return;
        }
        let sym = new IdSymbol(name);
        scope.symtab.set(name, sym);
        this.id.symbol = sym;
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        this.id.symbol.type = this.type;
    }
}
export class AssignmentStatement extends Statement {
    constructor(id, expr) {
        super("AssignStmt", [id, expr]);
        this.id = id;
        this.expr = expr;
    }
    applyBind(scope, buffer) {
        this.expr.applyBind(scope, buffer);
        let name = this.id.idName;
        let sym = scope.lookup(name);
        if (!sym) {
            buffer.stderr(`id ${name} has not been defined.`);
        }
        this.id.symbol = sym;
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        this.expr.applyType(buffer, this.id.symbol.type);
    }
    execute(buffer) {
        // TODO replace id with Expr, support lval
        let sym = this.id.symbol;
        sym.val = this.expr.rval(buffer);
    }
}
export class PrintStatement extends Statement {
    constructor(expr, isNewLine = false) {
        super("PrintStmt", [expr]);
        this.expr = expr;
        this.isNewLine = isNewLine;
    }
    execute(buffer) {
        let term = this.isNewLine ? "\n" : "";
        let str = this.expr.rval(buffer);
        if (str instanceof StringLiteral) {
            buffer.stdout(str.name + term);
        }
        else if (str instanceof NumberLiteral) {
            buffer.stdout(str.val + term);
        }
        else {
            // TODO better comparison to string.
            buffer.stderr("Error");
        }
    }
}
export class PrettyPrintStatement extends Statement {
    constructor(expr, isNewLine = false) {
        super("PrettyPrintStmt", [expr]);
        this.expr = expr;
        this.isNewLine = isNewLine;
    }
    execute(buffer) {
        // TODO handle latex
        let term = this.isNewLine ? "\n" : "";
        let str = this.expr.rval(buffer);
        if (str instanceof StringLiteral) {
            buffer.stdout(str.name + term);
        }
        else if (str instanceof NumberLiteral) {
            buffer.stdout(str.val + term);
        }
        else {
            // TODO better conversion to string.
            buffer.stderr("Error");
        }
    }
}
export class WhileLoop extends Statement {
    constructor(test, stmts) {
        let other = [];
        other.push(test);
        for (let child of stmts)
            other.push(child);
        super("WhileLoop", other);
        this.test = test;
        this.stmts = stmts;
    }
    applyBind(scope, buffer) {
        this.test.applyBind(scope, buffer);
        let childScope = new Scope(scope);
        for (let child of this.stmts) {
            child.applyBind(childScope, buffer);
        }
    }
    execute(buffer) {
        while (true) {
            let compVal = this.test.rval(buffer);
            if (compVal.val == 0)
                break;
            for (let child of this.stmts)
                child.execute(buffer);
        }
    }
}
export class ForLoop extends Statement {
    constructor(asg, test, it, stmts) {
        let other = [];
        for (let child of asg)
            other.push(child);
        other.push(test);
        for (let child of it)
            other.push(child);
        for (let child of stmts)
            other.push(child);
        super("ForLoop", other);
        this.asg = asg;
        this.test = test;
        this.it = it;
        this.stmts = stmts;
    }
    applyBind(scope, buffer) {
        let mainScope = new Scope(scope);
        let childScope = new Scope(mainScope);
        for (let child of this.asg)
            child.applyBind(mainScope, buffer);
        this.test.applyBind(mainScope, buffer);
        for (let child of this.it)
            child.applyBind(mainScope, buffer);
        for (let child of this.stmts)
            child.applyBind(childScope, buffer);
    }
    execute(buffer) {
        for (let child of this.asg)
            child.execute(buffer);
        while (true) {
            let compVal = this.test.rval(buffer);
            if (compVal.val == 0)
                break;
            for (let child of this.stmts)
                child.execute(buffer);
            for (let child of this.it)
                child.execute(buffer);
        }
    }
}
export class IfStmt extends Statement {
    constructor(test, stmts, elseStmts) {
        let other = [];
        other.push(test);
        for (let child of stmts)
            other.push(child);
        for (let child of elseStmts)
            other.push(child);
        super("IfStmt", other);
        this.test = test;
        this.stmts = stmts;
        this.elseStmts = elseStmts;
    }
    applyBind(scope, buffer) {
        this.test.applyBind(scope, buffer);
        let ifScope = new Scope(scope);
        let elseScope = new Scope(scope);
        for (let child of this.stmts)
            child.applyBind(ifScope, buffer);
        for (let child of this.elseStmts)
            child.applyBind(elseScope, buffer);
    }
    execute(buffer) {
        let compVal = this.test.rval(buffer);
        if (compVal.val != 0)
            for (let child of this.stmts)
                child.execute(buffer);
        else
            for (let child of this.elseStmts)
                child.execute(buffer);
    }
}
export class TypeAST extends AST {
    constructor(name) {
        super("UncertainType");
        if (typeof name == "number") {
            this.type = name;
            return;
        }
        switch (name) {
            case "Object":
            case "Obj":
                this.type = 1 /* TypeEnum.OBJECT */;
                this.name = "ObjType";
                break;
            case "Formula":
            case "Form":
                this.type = 2 /* TypeEnum.FORMULA */;
                this.name = "FormType";
                break;
            case "Real":
            case "R":
                this.type = 4 /* TypeEnum.REAL */;
                this.name = "RealType";
                break;
            case "Rational":
            case "Q":
                this.type = 8 /* TypeEnum.RATIONAL */;
                this.name = "RatType";
                break;
            case "Integer":
            case "Int":
            case "Z":
                this.type = 16 /* TypeEnum.INTEGER */;
                this.name = "IntType";
                break;
            case "Natural":
            case "N":
                this.type = 32 /* TypeEnum.NATURAL */;
                this.name = "NatType";
                break;
            case "Boolean":
            case "Bool":
                this.type = 64 /* TypeEnum.BOOLEAN */;
                this.name = "BoolType";
                break;
            case "String":
            case "Str":
                this.type = 6 /* TypeEnum.STRING */;
                this.name = "StrType";
                break;
            case "void":
                this.type = 5 /* TypeEnum.VOID */;
                this.name = "VoidType";
                break;
            default:
                this.type = 23456789 /* TypeEnum.DUMMY */;
                this.name = "DummyType";
                break;
        }
    }
    instanceOf(t) {
        if (t instanceof TypeAST)
            return divides(t.type, this.type);
        return divides(t, this.type);
    }
    closestParent(t) {
        if (t instanceof TypeAST)
            return new TypeAST(gcd(this.type, t.type));
        return new TypeAST(gcd(this.type, t));
    }
    isMathType() {
        return this.type % 4 /* TypeEnum.REAL */ == 0;
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~           EXPR ASTS           ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Expr extends Statement {
    constructor(name, args = [], type = new TypeAST("Dummy")) {
        super(name, args);
        this.type = type;
    }
    rval(buffer) {
        return this;
    }
    getChildrenRVals(buffer) {
        let childRVals = [];
        for (let child of this.args) {
            childRVals.push(child.rval(buffer));
        }
        return childRVals;
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        throw new Error("Must override this method!");
    }
    toLatex() {
        return `\\text{${this.name}}`;
    }
    builtinToString() {
        return this.toString();
    }
}
export class TypeCast extends Expr {
    constructor(name, args = [], type = new TypeAST("Dummy")) {
        super(name, args);
        // TODO
    }
}
export class StringLiteral extends Expr {
    constructor(name) {
        super(name, [], new TypeAST("String"));
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        if (expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */))
            return;
        if (!this.type.instanceOf(expectedType))
            buffer.stderr(`Cannot treat string "${this.name}" as type ${expectedType.type}`);
    }
    builtinToString() {
        return this.name;
    }
}
export class IdExpr extends Expr {
    constructor(id) {
        super("IdExpr", [id]);
        this.id = id;
    }
    rval(buffer) {
        return this.id.rval(buffer);
    }
    applyType(buffer, parentType = new TypeAST("Dummy")) {
        this.id.applyType(buffer, parentType);
        this.type = this.id.type;
    }
    toLatex() {
        return this.id.toLatex();
    }
    builtinToString() {
        return this.id.builtinToString();
    }
}
export class Id extends Expr {
    constructor(idName) {
        super("Id_" + idName, [], new TypeAST("Dummy"));
        this.symbol = null;
        this.idName = idName;
    }
    rval(buffer) {
        return this.symbol.rval(buffer);
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        this.type = this.symbol.type;
        if (expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */))
            return;
        if (expectedType.instanceOf(6 /* TypeEnum.STRING */)) {
            this.type = expectedType;
            return;
        }
        if (!this.type.instanceOf(expectedType))
            buffer.stderr(`Cannot treat ${this.idName} as type ${expectedType.type}`);
    }
    applyBind(scope, buffer) {
        let name = this.idName;
        let sym = scope.lookup(name);
        if (!sym) {
            buffer.stderr(`id ${name} has not been defined.`);
        }
        this.symbol = sym;
    }
    toLatex() {
        return this.symbol.toLatex();
    }
    toString() {
        return this.idName;
    }
    builtinToString() {
        return this.symbol.builtinToString();
    }
}
export class IdSymbol {
    constructor(name) {
        this.name = name;
        this.type = new TypeAST("Dummy");
        this.val = null;
        this.scope = null;
    }
    rval(buffer) {
        return this.val;
    }
    toLatex() {
        if (this.val == null)
            return "\\text{UNDEFINED}";
        return this.val.toLatex();
    }
    toString() {
        if (this.val == null)
            return `IdSymbol(${this.name})`;
        return this.val.toString();
    }
    builtinToString() {
        return this.val.builtinToString();
    }
}
export class ArrayAccess extends Expr {
    constructor(arr, ind) {
        super("arr", [arr, ind]);
        this.arr = arr;
        this.ind = ind;
    }
}
export class NumberLiteral extends Expr {
    constructor(name) {
        super("NumberLiteral_" + name, [], new TypeAST("Int"));
        this.val = Number(name);
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        if (expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */))
            return;
        if (expectedType.instanceOf(6 /* TypeEnum.STRING */)) {
            this.type = expectedType;
            return;
        }
        if (!this.type.instanceOf(expectedType))
            buffer.stderr(`Cannot treat number "${this.val}" as type ${expectedType.type}`);
    }
    rval(buffer) {
        if (this.type.instanceOf(6 /* TypeEnum.STRING */))
            return new StringLiteral("" + this.val);
        return this;
    }
    toString() {
        return this.val + "";
    }
    toLatex() {
        return this.val + "";
    }
    equals(other) {
        return this.val == other.val;
    }
}
export class IntegerLiteral extends Expr {
    constructor(name) {
        super("IntegerLiteral_" + name, [], new TypeAST("Int"));
        this.val = Number(name);
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        if (expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */))
            return;
        if (expectedType.instanceOf(6 /* TypeEnum.STRING */)) {
            this.type = expectedType;
            return;
        }
        if (!this.type.instanceOf(expectedType))
            buffer.stderr(`Cannot treat number "${this.val}" as type ${expectedType.type}`);
    }
    rval(buffer) {
        if (this.type.instanceOf(6 /* TypeEnum.STRING */))
            return new StringLiteral("" + this.val);
        return this;
    }
    toLongString() {
        return this.val + "";
    }
    toString() {
        return this.val + "";
    }
    toLatex() {
        return this.val + "";
    }
    equals(other) {
        return this.val == other.val;
    }
}
export class Scope {
    constructor(parent = null) {
        this.parent = parent;
        this.symtab = new Map();
    }
    depth() {
        if (this.parent == null)
            return 0;
        return 1 + this.parent.depth();
    }
    lookup(name) {
        let val = this.symtab.get(name);
        if (val)
            return val;
        if (this.parent != null)
            return this.parent.lookup(name);
        return null;
    }
}
