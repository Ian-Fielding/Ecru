program "valid Ecru program"
	= stmts:statements _ {return new AST.Program(stmts);}

statements "list of statements"
	= leftList:(_ statement _)* {
		let newArr=[];
		for(let i=0;i<leftList.length;i++)
			newArr=newArr.concat(leftList[i][1]);
		

		return newArr;
	}

statement "statement"
	= "pattern" _ left:expr _ "->" _ right:expr _ ";" {return "TODO";}
	/ stmt: commentStatement {return stmt}
	/ decl: declStatement _ assg:("=" _ expr)|0..1| _ ";" {
		if(assg.length==0)
			return decl;

		let expr=assg[0][2];
		return [decl,new AST.AssignmentStatement(decl.args[0],expr)];
	}
	/ id:identifier _ "=" _ expr:expr _ ";" {
		
		return new AST.AssignmentStatement(id,expr);
	}
	/ "println" _ val:expr _ ";" {return new AST.PrintStatement(val,true);}
	/ "pprintln" _ val:expr _ ";" {return new AST.PrettyPrintStatement(val,true);}
	/ "print" _ val:expr _ ";" {return new AST.PrintStatement(val);}
	/ "pprint" _ val:expr _ ";" {return new AST.PrettyPrintStatement(val);}
	/ ";" {return [];}

declStatement
	= id:identifier _ ":" _ type:type {return new AST.DeclarationStatement(id,type);}

identifier
	= first:[a-zA-Z] last:[a-zA-Z0-9]* {
		let id=first+UTIL.collapseArray(last);
		return new AST.Id(id);
	}
	

type
	= "Formula" {return new AST.FormulaType();}
	/ "String" {return new AST.StringType();}
	/ "Integer" {return new AST.IntegerType();}
	/ "Rational" {return new AST.RationalType();}
	/ "Real" {return new AST.RealType();}


commentStatement
	= "//" input:nonNewLine* "\n"  {
		return new AST.CommentStatement(UTIL.collapseArray(input).trim());
	}
	/ "/*" input:commentStatementHelper+ "/" {

		let filteredInput=UTIL.collapseArray(input);

		return new AST.CommentStatement(filteredInput.substring(0,filteredInput.length-1));
	}

commentStatementHelper
	= input:nonAsterisk* "*" {return UTIL.collapseArray(input)+"*";}

nonAsterisk
	= input:. &{return input!="*" && input!="/"} {return input[0]}
nonNewLine
	= input:. &{return input!="\n"} {return input[0]}


string = "\"" input:nonQuote* "\"" {
		return new AST.Str(UTIL.collapseArray(input));
	}
nonQuote
	= input:. &{return input!="\""} {return input[0]}

expr = id:identifier {return new AST.IdExpr(id);}
	/ string
	/ formula

formulae "list of formulae"
	= left:formula rightList:( _ "," _ formula)*{
		let newArr=Array(rightList.length+1);
		newArr[0]=left;
		for(let i=1;i<newArr.length;i++)
			newArr[i]=rightList[i-1][3];

		return newArr;
	}

formula = additive

additive
	= left:multiplicative rightList:(_ ("+" / "-") _ multiplicative)* {
		for(let expr of rightList){
			let op=expr[1];
			let right=expr[3];
			if(op=="+"){
				left=new AST.FormulaFunc("add",[left,right]);
			}else{
				left=new AST.FormulaFunc("sub",[left,right]);
			}
		}

		return left;
	}

multiplicative
	= left:negation rightList:(_ (("*" / "/") _ negation / exponent))* {
		for(let expr of rightList){

			let op;
			let right;
			if(expr.length==4){
				op=expr[1];
				right=expr[3];
			}else{
				op="*";
				right=expr[1];
			}
			
			if(op=="/"){
				left=new AST.FormulaFunc("div",[left,right]);
			}else{
				left=new AST.FormulaFunc("mul",[left,right]);
			}
		}

		return left;
	}

negation
	= leftList:("-" _)* right:exponent {
		for(let i in leftList){
			right=new AST.FormulaFunc("neg",[right]);
		}

		return right;
	}

exponent
	= leftList:(factorial _ "^" _)* right:factorial {
		for(let i=leftList.length-1;i>=0;i--){
			let left=leftList[i][0];
			right=new AST.FormulaFunc("pow",[left,right]);
		}

		return right;
	}



factorial
	= left:func rightList:(_ "!")* {
		for(let i in rightList){
			left = new AST.FormulaFunc("fact",[left]);
		}

		return left;
	}

func
	= left:funcName "(" _ rightList:formulae _ ")" {
		return new AST.FormulaFunc(left,rightList);
	}
	/ left:funcName _ right:multiplicative {
		return new AST.FormulaFunc(left,[right]);
	}
	/ primary

funcName
	= "add" / "sub" / "mul" / "div" / "pow" / "root" / "sqrt" / "sum" / "prod" / "log" / "ln" / "sin" / "cos" / "tan" / "sec" / "csc" / "cot" / "arcsin" / "arccos" / "arctan" / "arcsec" / "arccsc" / "arctan" / "sinh" / "cosh" / "tanh" / "sech" / "csch" / "coth" / "arcsinh" / "arccosh" / "arctanh" / "arcsech" / "arccsch" / "arctanh" / "eval_add" / "eval_negate" / "eval_multiply" / "eval_pow"

primary
	= number
	/ "(" additive:additive ")" { return additive; }
	/ constant

constant
	= val:[a-z] {return new AST.FormulaId(val)}

number
	= digits:[0-9]+ { return new AST.FormulaNumberLiteral(parseInt(digits.join(""), 10)); }

_ "whitespace"
	= [ \t\r\n]*