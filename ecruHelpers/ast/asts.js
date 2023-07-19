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
    getChildren() {
        return this.args;
    }
    toString() {
        if (this.args.length == 0)
            return this.name + "()";
        let str = `${this.name}(${this.args[0]}`;
        for (let i = 1; i < this.args.length; i++)
            str += "," + this.args[i];
        return str + ")";
    }
    on(options) {
        return options;
    }
    run(options) {
        options = this.on(options);
        for (let child of this.args) {
            options = child.run(options);
        }
        return options;
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
    constructor(stmts) {
        super("Program", stmts);
    }
    toString() {
        return "Program(...)";
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
    on(options) {
        if (options.currScope) {
            let currScope = options.currScope;
            let name = this.id.idName;
            if (currScope.lookup(name)) {
                //TODO Throw error
                console.log(`Error! The variable ${name} has already been defined!`);
            }
            let sym = new IdSymbol(name);
            currScope.symtab.set(name, sym);
            this.id.symbol = sym;
            sym.type = this.type;
        }
        return options;
    }
}
export class AssignmentStatement extends Statement {
    constructor(id, expr) {
        super("AssignStmt", [id, expr]);
        this.id = id;
        this.expr = expr;
    }
    on(options) {
        if (options.currScope) {
            let currScope = options.currScope;
            let name = this.id.idName;
            let sym = currScope.lookup(name);
            if (!sym) {
                //TODO Throw error
                console.log(`Error! The variable ${name} has not been defined!`);
            }
            this.id.symbol = sym;
            //TODO Typecheck
        }
        if (options.run) {
            let sym = this.id.symbol;
            if (sym == null) {
                //TODO Throw error
                console.log(`Error! The variable ${name} has not been defined!`);
                return options;
            }
            sym.val = this.expr.getVal();
        }
        return options;
    }
}
export class PrintStatement extends Statement {
    constructor(expr, isNewLine = false) {
        super("PrintStmt", [expr]);
        this.expr = expr;
        this.isNewLine = isNewLine;
    }
    on(options) {
        if (options.run) {
            let str = this.expr.toString();
            let con = document.getElementById("console");
            con.innerHTML += str;
            if (this.isNewLine)
                con.innerHTML += "<hr>";
        }
        return options;
    }
}
export class PrettyPrintStatement extends Statement {
    constructor(expr, isNewLine = false) {
        super("PrettyPrintStmt", [expr]);
        this.expr = expr;
        this.isNewLine = isNewLine;
    }
    on(options) {
        if (options.run) {
            let str = this.expr.toLatex();
            let con = document.getElementById("console");
            con.innerHTML += `$${str}$`;
            if (this.isNewLine)
                con.innerHTML += "<hr>";
            MathJax.typeset();
        }
        return options;
    }
}
class Type extends AST {
    constructor(type) {
        super(type);
        this.type = type;
    }
}
export class FormulaType extends Type {
    constructor() {
        super("FormulaType");
    }
}
export class StringType extends Type {
    constructor() {
        super("StringType");
    }
}
export class IntegerType extends Type {
    constructor() {
        super("IntegerType");
    }
}
export class RationalType extends Type {
    constructor() {
        super("RationalType");
    }
}
export class RealType extends Type {
    constructor() {
        super("RealType");
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~           EXPR ASTS           ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Expr extends AST {
    constructor(name, args = []) {
        super(name, args);
    }
    getVal() {
        return this;
    }
    toLatex() {
        return `\\text{${this.name}}`;
    }
    toString() {
        return this.name;
    }
}
export class Str extends Expr {
    constructor(name) {
        super(name);
    }
}
export class IdExpr extends Expr {
    constructor(id) {
        super("IdExpr", [id]);
        this.id = id;
    }
    getVal() {
        return this.id.getVal();
    }
    toLatex() {
        return this.id.toLatex();
    }
    toString() {
        return this.id.toString();
    }
}
export class Id extends AST {
    constructor(idName) {
        super("Id_" + idName, []);
        this.symbol = null;
        this.idName = idName;
    }
    getVal() {
        if (this.symbol == null)
            return null;
        return this.symbol.getVal();
    }
    on(options) {
        if (options.currScope) {
            let currScope = options.currScope;
            let name = this.idName;
            let sym = currScope.lookup(name);
            if (sym == null) {
                //TODO Throw error
                console.log(`Error! The variable ${name} has not been defined!`);
            }
            //TODO Typecheck
            this.symbol = sym;
        }
        return options;
    }
    toLatex() {
        if (this.symbol == null)
            return this.idName;
        return this.symbol.toLatex();
    }
    toString() {
        if (this.symbol == null)
            return this.idName;
        return this.symbol.toString();
    }
}
export class IdSymbol extends AST {
    constructor(name) {
        super("IdSymbol_" + name, []);
        this.type = null;
        this.val = null;
        this.scope = null;
    }
    getVal() {
        return this.val;
    }
    toLatex() {
        if (this.val == null)
            return "\\text{UNDEFINED}";
        return this.val.toLatex();
    }
    toString() {
        if (this.val == null)
            return `IdSymbol(${this.args[0]})`;
        return this.val.toString();
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         FORMULAE ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
class Formula extends Expr {
    constructor(name, args = []) {
        super(name, args);
        this.formulaArgs = args;
    }
    checkPattern(pattern, bind) {
        if (pattern.constructor === this.constructor)
            return this.equals(pattern);
        return pattern.bind(this, bind);
    }
    applyBind(bind) {
        return this;
    }
    applyPattern(match, other) {
        if (this.equals(match))
            return other;
        return this;
    }
    evaluate() {
        return null;
    }
}
export class FormulaFunc extends Formula {
    constructor(name, args) {
        super(name, args);
    }
    evaluate() {
        let k, j;
        switch (this.name) {
            case "eval_add":
                let sum = 0;
                for (let i = 0; i < this.formulaArgs.length; i++) {
                    k = this.formulaArgs[i].evaluate();
                    sum += k.val;
                }
                return new FormulaNumberLiteral(sum + "");
            case "eval_multiply":
                let prod = 1;
                for (let i = 0; i < this.formulaArgs.length; i++) {
                    k = this.formulaArgs[i].evaluate();
                    prod *= k.val;
                }
                return new FormulaNumberLiteral(prod + "");
            case "eval_negate":
                k = this.formulaArgs[0].evaluate();
                return new FormulaNumberLiteral((-k.val) + "");
            case "eval_pow":
                if (this.formulaArgs.length != 2)
                    throw new Error("TODO");
                k = this.formulaArgs[0].evaluate();
                j = this.formulaArgs[1].evaluate();
                let base = k.val;
                let pow = j.val;
                if (!Number.isInteger(pow))
                    return new FormulaNumberLiteral(Math.pow(base, pow) + "");
                function getPow(a, b) {
                    if (b == 0)
                        return 1;
                    if (b < 0)
                        return 0;
                    return a * getPow(a, b - 1);
                }
                return new FormulaNumberLiteral(getPow(base, pow) + "");
            default:
                return null;
        }
    }
}
export class FormulaNumberLiteral extends Formula {
    constructor(name) {
        super("FormulaNumberLiteral_" + name, []);
        this.val = Number(name);
    }
    getChildren() {
        return [];
    }
    toString() {
        return this.val + "";
    }
    toLatex() {
        return this.val + "";
    }
    equals(other) {
        if (!(other instanceof FormulaNumberLiteral))
            return false;
        return this.val == other.val;
    }
    evaluate() {
        return this;
    }
    bind(node, bind) {
        if (this.equals(node)) {
            return true;
        }
        return false;
    }
}
export class FormulaId extends Formula {
    constructor(name) {
        super("FormulaId_" + name, []);
        this.val = name;
    }
    toLatex() {
        return this.val;
    }
    toString() {
        return this.val;
    }
    equals(other) {
        if (!(other instanceof FormulaId))
            return false;
        return this.name == other.name;
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PATTERN  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
class Pattern extends Formula {
    constructor(name, args = []) {
        super(name, args);
    }
    equals(other) {
        return this.name == other.name;
    }
    applyBind(bind) {
        let out = bind.get(this.name);
        return out == null ? this : out;
    }
}
export class PatternExpression extends Pattern {
    constructor(name) {
        super(`E_{${name}}`, []);
        this.patternName = `E_{${name}}`;
    }
    bind(node, bind) {
        let out = bind.get(this.patternName);
        if (out != null && !node.equals(out))
            return false;
        bind.set(this.patternName, node);
        return true;
    }
}
export class PatternInteger extends Pattern {
    constructor(name) {
        super(`k_{${name}}`, []);
        this.patternName = `k_{${name}}`;
    }
    bind(node, bind) {
        let out = bind.get(this.patternName);
        if (out != null && !node.equals(out))
            return false;
        let expr = node instanceof FormulaNumberLiteral;
        if (!expr) {
            return false;
        }
        else {
            return bind.set(this.patternName, node);
        }
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~             UTIL              ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Binding {
    constructor(vars, history = []) {
        this.vars = vars;
        this.map = new Map();
        this.history = history;
        for (let key of this.vars)
            this.map.set(key, null);
    }
    toLatex() {
        return this.toString();
    }
    isComplete() {
        for (let key of this.vars)
            if (this.map.get(key) == null)
                return false;
        return true;
    }
    equals(other) {
        for (let key of this.vars) {
            let obj1 = this.map.get(key);
            let obj2 = other.map.get(key);
            if (obj1 == undefined || obj2 == undefined)
                return false;
            if (obj1 == null)
                return obj2 == null;
            return obj1.equals(obj2);
        }
        return true;
    }
    containsKey(key) {
        return this.map.has(key) && this.map.get(key) != null;
    }
    get(key) {
        let obj = this.map.get(key);
        return obj == undefined ? null : obj;
    }
    set(key, value) {
        for (let i = 0; i < this.vars.length; i++) {
            let test = this.vars[i];
            if (key == test)
                return false;
        }
        if (this.map.get(key) != null)
            return false;
        this.map.set(key, value);
        if (this.isComplete()) {
            for (let i = 0; i < this.history.length; i++) {
                if (this.history[i].equals(this)) {
                    this.clear();
                    return false;
                }
            }
        }
        return true;
    }
    clear() {
        for (let key of this.vars)
            this.map.set(key, null);
    }
    toString() {
        let str = "";
        for (let obj of this.vars) {
            let out = this.get(obj);
            str += `$$${obj}: ${out ? out.toString() : "null"}$$`;
        }
        return str;
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
