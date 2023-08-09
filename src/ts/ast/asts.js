"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = exports.NumberLiteral = exports.ArrayAccess = exports.IdSymbol = exports.Id = exports.IdExpr = exports.StringLiteral = exports.LogicalOr = exports.Expr = exports.TypeAST = exports.IfStmt = exports.WhileLoop = exports.PrettyPrintStatement = exports.PrintStatement = exports.AssignmentStatement = exports.DeclarationStatement = exports.CommentStatement = exports.Program = void 0;
var utils_js_1 = require("../utils.js");
var AST = /** @class */ (function () {
    function AST(name, args) {
        if (args === void 0) { args = []; }
        this.name = name;
        this.args = args;
    }
    // deep copy of this AST
    AST.prototype.copy = function () {
        var newObj = this.constructor(name);
        for (var _i = 0, _a = this.args; _i < _a.length; _i++) {
            var arg = _a[_i];
            newObj.args.push(arg.copy());
        }
        return newObj;
    };
    AST.prototype.getChildren = function () {
        return this.args;
    };
    AST.prototype.toString = function () {
        if (this.args.length == 0)
            return this.name + "()";
        var str = "".concat(this.name, "(").concat(this.args[0]);
        for (var i = 1; i < this.args.length; i++)
            str += "," + this.args[i];
        return str + ")";
    };
    AST.prototype.applyBind = function (scope, buffer) {
        for (var _i = 0, _a = this.args; _i < _a.length; _i++) {
            var child = _a[_i];
            child.applyBind(scope, buffer);
        }
    };
    AST.prototype.applyType = function (buffer, expectedType) {
        if (expectedType === void 0) { expectedType = new TypeAST("Dummy"); }
        for (var _i = 0, _a = this.args; _i < _a.length; _i++) {
            var child = _a[_i];
            child.applyType(buffer, expectedType);
        }
    };
    AST.prototype.execute = function (buffer) {
        for (var _i = 0, _a = this.args; _i < _a.length; _i++) {
            var child = _a[_i];
            child.execute(buffer);
        }
    };
    AST.prototype.equals = function (other) {
        if (this.name != other.name || this.args.length != other.args.length)
            return false;
        for (var i = 0; i < this.args.length; i++)
            if (!this.args[i].equals(other.args[i]))
                return false;
        return true;
    };
    return AST;
}());
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PROGRAM  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var Program = /** @class */ (function (_super) {
    __extends(Program, _super);
    function Program(stmts) {
        if (stmts === void 0) { stmts = []; }
        return _super.call(this, "Program", stmts) || this;
    }
    Program.prototype.toLongString = function () {
        var str = "";
        for (var i = 0; i < this.args.length; i++) {
            str += "---\n".concat(i, ". ").concat(this.args[i].toString(), "\n");
        }
        return str;
    };
    return Program;
}(AST));
exports.Program = Program;
var Statement = /** @class */ (function (_super) {
    __extends(Statement, _super);
    function Statement(name, args) {
        if (args === void 0) { args = []; }
        return _super.call(this, name, args) || this;
    }
    return Statement;
}(AST));
var CommentStatement = /** @class */ (function (_super) {
    __extends(CommentStatement, _super);
    function CommentStatement(str) {
        var _this = _super.call(this, "CommentStmt_" + str) || this;
        _this.str = str;
        return _this;
    }
    return CommentStatement;
}(Statement));
exports.CommentStatement = CommentStatement;
var DeclarationStatement = /** @class */ (function (_super) {
    __extends(DeclarationStatement, _super);
    function DeclarationStatement(id, type) {
        var _this = _super.call(this, "DeclStmt", [id, type]) || this;
        _this.id = id;
        _this.type = type;
        return _this;
    }
    DeclarationStatement.prototype.applyBind = function (scope, buffer) {
        var name = this.id.idName;
        if (scope.lookup(name)) {
            buffer.stderr("id ".concat(name, " has already been defined."));
            return;
        }
        var sym = new IdSymbol(name);
        scope.symtab.set(name, sym);
        this.id.symbol = sym;
    };
    DeclarationStatement.prototype.applyType = function (buffer, expectedType) {
        if (expectedType === void 0) { expectedType = new TypeAST("Dummy"); }
        this.id.symbol.type = this.type;
    };
    return DeclarationStatement;
}(Statement));
exports.DeclarationStatement = DeclarationStatement;
var AssignmentStatement = /** @class */ (function (_super) {
    __extends(AssignmentStatement, _super);
    function AssignmentStatement(id, expr) {
        var _this = _super.call(this, "AssignStmt", [id, expr]) || this;
        _this.id = id;
        _this.expr = expr;
        return _this;
    }
    AssignmentStatement.prototype.applyBind = function (scope, buffer) {
        this.expr.applyBind(scope, buffer);
        var name = this.id.idName;
        var sym = scope.lookup(name);
        if (!sym) {
            buffer.stderr("id ".concat(name, " has not been defined."));
        }
        this.id.symbol = sym;
    };
    AssignmentStatement.prototype.applyType = function (buffer, expectedType) {
        if (expectedType === void 0) { expectedType = new TypeAST("Dummy"); }
        this.expr.applyType(buffer, this.id.symbol.type);
    };
    AssignmentStatement.prototype.execute = function (buffer) {
        // TODO replace id with Expr, support lval
        var sym = this.id.symbol;
        sym.val = this.expr.rval();
    };
    return AssignmentStatement;
}(Statement));
exports.AssignmentStatement = AssignmentStatement;
var PrintStatement = /** @class */ (function (_super) {
    __extends(PrintStatement, _super);
    function PrintStatement(expr, isNewLine) {
        if (isNewLine === void 0) { isNewLine = false; }
        var _this = _super.call(this, "PrintStmt", [expr]) || this;
        _this.expr = expr;
        _this.isNewLine = isNewLine;
        return _this;
    }
    PrintStatement.prototype.execute = function (buffer) {
        var term = this.isNewLine ? "\n" : "";
        var str = this.expr.rval();
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
    };
    return PrintStatement;
}(Statement));
exports.PrintStatement = PrintStatement;
var PrettyPrintStatement = /** @class */ (function (_super) {
    __extends(PrettyPrintStatement, _super);
    function PrettyPrintStatement(expr, isNewLine) {
        if (isNewLine === void 0) { isNewLine = false; }
        var _this = _super.call(this, "PrettyPrintStmt", [expr]) || this;
        _this.expr = expr;
        _this.isNewLine = isNewLine;
        return _this;
    }
    PrettyPrintStatement.prototype.execute = function (buffer) {
        // TODO handle latex
        var term = this.isNewLine ? "\n" : "";
        var str = this.expr.rval();
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
    };
    return PrettyPrintStatement;
}(Statement));
exports.PrettyPrintStatement = PrettyPrintStatement;
var WhileLoop = /** @class */ (function (_super) {
    __extends(WhileLoop, _super);
    function WhileLoop(test, stmts) {
        var _this = this;
        var other = [];
        other.push(test);
        for (var _i = 0, stmts_1 = stmts; _i < stmts_1.length; _i++) {
            var child = stmts_1[_i];
            other.push(child);
        }
        _this = _super.call(this, "WhileLoop", other) || this;
        _this.test = test;
        _this.stmts = stmts;
        return _this;
    }
    WhileLoop.prototype.applyBind = function (scope, buffer) {
        this.test.applyBind(scope, buffer);
        var childScope = new Scope(scope);
        for (var _i = 0, _a = this.stmts; _i < _a.length; _i++) {
            var child = _a[_i];
            child.applyBind(childScope, buffer);
        }
    };
    WhileLoop.prototype.execute = function (buffer) {
        while (true) {
            var compVal = this.test.rval();
            if (compVal.val == 0)
                break;
            for (var _i = 0, _a = this.stmts; _i < _a.length; _i++) {
                var child = _a[_i];
                child.execute(buffer);
            }
        }
    };
    return WhileLoop;
}(Statement));
exports.WhileLoop = WhileLoop;
var IfStmt = /** @class */ (function (_super) {
    __extends(IfStmt, _super);
    function IfStmt(test, stmts, elseStmts) {
        var _this = this;
        var other = [];
        other.push(test);
        for (var _i = 0, stmts_2 = stmts; _i < stmts_2.length; _i++) {
            var child = stmts_2[_i];
            other.push(child);
        }
        for (var _a = 0, elseStmts_1 = elseStmts; _a < elseStmts_1.length; _a++) {
            var child = elseStmts_1[_a];
            other.push(child);
        }
        _this = _super.call(this, "IfStmt", other) || this;
        _this.test = test;
        _this.stmts = stmts;
        _this.elseStmts = elseStmts;
        return _this;
    }
    IfStmt.prototype.applyBind = function (scope, buffer) {
        this.test.applyBind(scope, buffer);
        var ifScope = new Scope(scope);
        var elseScope = new Scope(scope);
        for (var _i = 0, _a = this.stmts; _i < _a.length; _i++) {
            var child = _a[_i];
            child.applyBind(ifScope, buffer);
        }
        for (var _b = 0, _c = this.elseStmts; _b < _c.length; _b++) {
            var child = _c[_b];
            child.applyBind(elseScope, buffer);
        }
    };
    IfStmt.prototype.execute = function (buffer) {
        var compVal = this.test.rval();
        console.log(compVal);
        if (compVal.val != 0)
            for (var _i = 0, _a = this.stmts; _i < _a.length; _i++) {
                var child = _a[_i];
                child.execute(buffer);
            }
        else
            for (var _b = 0, _c = this.elseStmts; _b < _c.length; _b++) {
                var child = _c[_b];
                child.execute(buffer);
            }
    };
    return IfStmt;
}(Statement));
exports.IfStmt = IfStmt;
var PRIMES = [2, 3, 5];
var TypeAST = /** @class */ (function (_super) {
    __extends(TypeAST, _super);
    function TypeAST(name) {
        var _this = _super.call(this, "UncertainType") || this;
        if (typeof name == "number") {
            _this.type = name;
            return _this;
        }
        switch (name) {
            case "Object":
            case "Obj":
                _this.type = 1 /* TypeEnum.OBJECT */;
                _this.name = "ObjType";
                break;
            case "Formula":
            case "Form":
                _this.type = 2 /* TypeEnum.FORMULA */;
                _this.name = "FormType";
                break;
            case "Real":
            case "R":
                _this.type = 4 /* TypeEnum.REAL */;
                _this.name = "RealType";
                break;
            case "Rational":
            case "Q":
                _this.type = 8 /* TypeEnum.RATIONAL */;
                _this.name = "RatType";
                break;
            case "Integer":
            case "Int":
            case "Z":
                _this.type = 16 /* TypeEnum.INTEGER */;
                _this.name = "IntType";
                break;
            case "Natural":
            case "N":
                _this.type = 32 /* TypeEnum.NATURAL */;
                _this.name = "NatType";
                break;
            case "Boolean":
            case "Bool":
                _this.type = 64 /* TypeEnum.BOOLEAN */;
                _this.name = "BoolType";
                break;
            case "String":
            case "Str":
                _this.type = 6 /* TypeEnum.STRING */;
                _this.name = "StrType";
                break;
            case "void":
                _this.type = 5 /* TypeEnum.VOID */;
                _this.name = "VoidType";
                break;
            default:
                _this.type = 23456789 /* TypeEnum.DUMMY */;
                _this.name = "DummyType";
                break;
        }
        return _this;
    }
    TypeAST.prototype.instanceOf = function (t) {
        if (t instanceof TypeAST)
            return (0, utils_js_1.divides)(t.type, this.type);
        return (0, utils_js_1.divides)(t, this.type);
    };
    TypeAST.prototype.closestParent = function (t) {
        if (t instanceof TypeAST)
            return new TypeAST((0, utils_js_1.gcd)(this.type, t.type));
        return new TypeAST((0, utils_js_1.gcd)(this.type, t));
    };
    TypeAST.prototype.isMathType = function () {
        return this.type % 4 /* TypeEnum.REAL */ == 0;
    };
    return TypeAST;
}(AST));
exports.TypeAST = TypeAST;
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~           EXPR ASTS           ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var Expr = /** @class */ (function (_super) {
    __extends(Expr, _super);
    function Expr(name, args, type) {
        if (args === void 0) { args = []; }
        if (type === void 0) { type = new TypeAST("Dummy"); }
        var _this = _super.call(this, name, args) || this;
        _this.type = type;
        return _this;
    }
    Expr.prototype.rval = function () {
        return this;
    };
    Expr.prototype.applyType = function (buffer, expectedType) {
        if (expectedType === void 0) { expectedType = new TypeAST("Dummy"); }
        throw new Error("Must override this method!");
    };
    Expr.prototype.toLatex = function () {
        return "\\text{".concat(this.name, "}");
    };
    Expr.prototype.builtinToString = function () {
        return this.toString();
    };
    return Expr;
}(Statement));
exports.Expr = Expr;
var LogicalOr = /** @class */ (function (_super) {
    __extends(LogicalOr, _super);
    function LogicalOr() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return LogicalOr;
}(Expr));
exports.LogicalOr = LogicalOr;
var StringLiteral = /** @class */ (function (_super) {
    __extends(StringLiteral, _super);
    function StringLiteral(name) {
        return _super.call(this, name, [], new TypeAST("String")) || this;
    }
    StringLiteral.prototype.applyType = function (buffer, expectedType) {
        if (expectedType === void 0) { expectedType = new TypeAST("Dummy"); }
        if (expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */))
            return;
        if (!this.type.instanceOf(expectedType))
            buffer.stderr("Cannot treat string \"".concat(this.name, "\" as type ").concat(expectedType.type));
    };
    StringLiteral.prototype.builtinToString = function () {
        return this.name;
    };
    return StringLiteral;
}(Expr));
exports.StringLiteral = StringLiteral;
var IdExpr = /** @class */ (function (_super) {
    __extends(IdExpr, _super);
    function IdExpr(id) {
        var _this = _super.call(this, "IdExpr", [id]) || this;
        _this.id = id;
        return _this;
    }
    IdExpr.prototype.rval = function () {
        return this.id.rval();
    };
    IdExpr.prototype.applyType = function (buffer, parentType) {
        if (parentType === void 0) { parentType = new TypeAST("Dummy"); }
        this.id.applyType(buffer, parentType);
        this.type = this.id.type;
    };
    IdExpr.prototype.toLatex = function () {
        return this.id.toLatex();
    };
    IdExpr.prototype.builtinToString = function () {
        return this.id.builtinToString();
    };
    return IdExpr;
}(Expr));
exports.IdExpr = IdExpr;
var Id = /** @class */ (function (_super) {
    __extends(Id, _super);
    function Id(idName) {
        var _this = _super.call(this, "Id_" + idName, [], new TypeAST("Dummy")) || this;
        _this.symbol = null;
        _this.idName = idName;
        return _this;
    }
    Id.prototype.rval = function () {
        return this.symbol.rval();
    };
    Id.prototype.applyType = function (buffer, expectedType) {
        if (expectedType === void 0) { expectedType = new TypeAST("Dummy"); }
        this.type = this.symbol.type;
        if (expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */))
            return;
        if (expectedType.instanceOf(6 /* TypeEnum.STRING */)) {
            this.type = expectedType;
            return;
        }
        if (!this.type.instanceOf(expectedType))
            buffer.stderr("Cannot treat ".concat(this.idName, " as type ").concat(expectedType.type));
    };
    Id.prototype.applyBind = function (scope, buffer) {
        var name = this.idName;
        var sym = scope.lookup(name);
        if (!sym) {
            buffer.stderr("id ".concat(name, " has not been defined."));
        }
        this.symbol = sym;
    };
    Id.prototype.toLatex = function () {
        return this.symbol.toLatex();
    };
    Id.prototype.toString = function () {
        return this.idName;
    };
    Id.prototype.builtinToString = function () {
        return this.symbol.builtinToString();
    };
    return Id;
}(Expr));
exports.Id = Id;
var IdSymbol = /** @class */ (function () {
    function IdSymbol(name) {
        this.name = name;
        this.type = new TypeAST("Dummy");
        this.val = null;
        this.scope = null;
    }
    IdSymbol.prototype.rval = function () {
        return this.val;
    };
    IdSymbol.prototype.toLatex = function () {
        if (this.val == null)
            return "\\text{UNDEFINED}";
        return this.val.toLatex();
    };
    IdSymbol.prototype.toString = function () {
        if (this.val == null)
            return "IdSymbol(".concat(this.name, ")");
        return this.val.toString();
    };
    IdSymbol.prototype.builtinToString = function () {
        return this.val.builtinToString();
    };
    return IdSymbol;
}());
exports.IdSymbol = IdSymbol;
var ArrayAccess = /** @class */ (function (_super) {
    __extends(ArrayAccess, _super);
    function ArrayAccess(arr, ind) {
        var _this = _super.call(this, "arr", [arr, ind]) || this;
        _this.arr = arr;
        _this.ind = ind;
        return _this;
    }
    return ArrayAccess;
}(Expr));
exports.ArrayAccess = ArrayAccess;
var NumberLiteral = /** @class */ (function (_super) {
    __extends(NumberLiteral, _super);
    function NumberLiteral(name) {
        var _this = _super.call(this, "NumberLiteral_" + name, [], new TypeAST("Int")) || this;
        _this.val = Number(name);
        return _this;
    }
    NumberLiteral.prototype.applyType = function (buffer, expectedType) {
        if (expectedType === void 0) { expectedType = new TypeAST("Dummy"); }
        if (expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */))
            return;
        if (expectedType.instanceOf(6 /* TypeEnum.STRING */)) {
            this.type = expectedType;
            return;
        }
        if (!this.type.instanceOf(expectedType))
            buffer.stderr("Cannot treat number \"".concat(this.val, "\" as type ").concat(expectedType.type));
    };
    NumberLiteral.prototype.rval = function () {
        if (this.type.instanceOf(6 /* TypeEnum.STRING */))
            return new StringLiteral("" + this.val);
        return this;
    };
    NumberLiteral.prototype.toString = function () {
        return this.val + "";
    };
    NumberLiteral.prototype.toLatex = function () {
        return this.val + "";
    };
    NumberLiteral.prototype.equals = function (other) {
        return this.val == other.val;
    };
    return NumberLiteral;
}(Expr));
exports.NumberLiteral = NumberLiteral;
var Scope = /** @class */ (function () {
    function Scope(parent) {
        if (parent === void 0) { parent = null; }
        this.parent = parent;
        this.symtab = new Map();
    }
    Scope.prototype.depth = function () {
        if (this.parent == null)
            return 0;
        return 1 + this.parent.depth();
    };
    Scope.prototype.lookup = function (name) {
        var val = this.symtab.get(name);
        if (val)
            return val;
        if (this.parent != null)
            return this.parent.lookup(name);
        return null;
    };
    return Scope;
}());
exports.Scope = Scope;
