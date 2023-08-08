
/*
 *
 *
 *	PROGRAM AND STATEMENTS
 *
 *
 */

program "valid Ecru program"
	= stmts:statements __ {return new AST.Program(stmts);}

statements "list of statements"
	= leftList:(_ statement)* {
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
	/ ifStmt
	/ whileLoop
	/ left:expr _ ";" {return left;}
	/ ";" {return [];}

declStatement "declaration statement"
	= id:identifier _ ":" _ type:type {return new AST.DeclarationStatement(id,type);}

commentStatement "comment statement"
	= "//" input:nonNewLine* "\n"  {
		return new AST.CommentStatement(input.join("").trim());
	}
	/ "/*" input:commentStatementHelper+ "/" {

		let filteredInput=input.join("");

		return new AST.CommentStatement(filteredInput.substring(0,filteredInput.length-1));
	}
commentStatementHelper
	= input:nonAsterisk* "*" {return input.join("")+"*";}
nonAsterisk
	= input:. &{return input!="*" && input!="/"} {return input[0]}
nonNewLine
	= input:. &{return input!="\n"} {return input[0]}

whileLoop "while loop"
	= "while" _ test:expr _ "{" _ stmts:statements _ "}" {
		return new AST.WhileLoop(test,stmts);
	}

ifStmt "if statement"
	= "if" _ test:expr _ "{" _ stmts:statements _ "}" _ elsePart:("else" _ "{" _ statements _ "}")|0..1| {

		let elseStmts = elsePart.length==0 ? [] : elsePart[0][4];

		return new AST.IfStmt(test,stmts,elseStmts);
	}








/*
 *
 *
 *	STRINGS
 *
 *
 */


string = "\"" input:nonQuote* "\"" {
		return new AST.StringLiteral(input.join(""));
	}
nonQuote
	= input:. &{return input!="\""} {return input[0]}







/*
 *
 *
 *	EXPRS
 *
 *
 */



exprs "list of expressions"
	= left:expr rightList:( _ "," _ expr)*{
		let newArr=Array(rightList.length+1);
		newArr[0]=left;
		for(let i=1;i<newArr.length;i++)
			newArr[i]=rightList[i-1][3];

		return newArr;
	}

expr = additive


additive
	= left:multiplicative rightList:(_ ("+" / "-") _ multiplicative)* {
		for(let expr of rightList){
			let op=expr[1];
			let right=expr[3];
			if(op=="+"){
				left=new MATH.Add([left,right]);
			}else{
				left=new MATH.Sub([left,right]);
			}
		}

		return left;
	}

multiplicative
	= left:negation rightList:(_ ("*" / "/") _ negation)* {
		for(let expr of rightList){

			let op=expr[1];
			let right=expr[3];
			
			if(op=="/"){
				left=new MATH.Div([left,right]);
			}else{
				left=new MATH.Mul([left,right]);
			}
		}

		return left;
	}

negation
	= leftList:("-" _)* right:exponent {
		for(let i in leftList){
			right=new MATH.BuiltinFunc("neg",[right]);
		}

		return right;
	}

exponent
	= leftList:(factorial _ "^" _)* right:factorial {
		for(let i=leftList.length-1;i>=0;i--){
			let left=leftList[i][0];
			right=new MATH.BuiltinFunc("pow",[left,right]);
		}

		return right;
	}



factorial
	= left:func rightList:(_ "!")* {
		for(let i in rightList){
			left = new MATH.BuiltinFunc("fact",[left]);
		}

		return left;
	}

func
	= left:primary rightList:(("(" / "[") _ exprs _ (")" / "]"))* {
		for(let l of rightList){
			let p1=l[0];
			let exprs=l[2];
			let p2=l[4];

			if(p1=="(" && p2==")")
				left = new MATH.BuiltinFunc(left,exprs);
			else if(p1=="[" && p2=="]" && exprs.length==1)
				left = new AST.ArrayAccess(left,exprs[0]);
			else if(exprs.length!=1)
				throw new Error("only 1 expression allowed in []");
			else
				throw new Error("unbalanced () or []");

		}

		return left;
	}
	/*/ left:idExpr _ right:multiplicative {
		return new MATH.BuiltinFunc(left,[right]);
	}*/
funcName
	= "add" / "sub" / "mul" / "div" / "pow" / "root" / "sqrt" / "sum" / "prod" / "log" / "ln" / "sin" / "cos" / "tan" / "sec" / "csc" / "cot" / "arcsin" / "arccos" / "arctan" / "arcsec" / "arccsc" / "arctan" / "sinh" / "cosh" / "tanh" / "sech" / "csch" / "coth" / "arcsinh" / "arccosh" / "arctanh" / "arcsech" / "arccsch"



primary
	= number
	/ "(" additive:additive ")" { return additive; }
	/ idExpr
	/ string


idExpr = id:identifier {return new AST.IdExpr(id);}




/*
 *
 *
 *	MISC
 *
 *
 */


identifier
	= first:[a-zA-Z] last:[a-zA-Z0-9_]* {
		let id=first+last.join("");
		return new AST.Id(id);
	}
	

type
	= left:("Object" / 
		"Obj" / 
		"Formula" / 
		"Form" / 
		"Real" / 
		"R" / 
		"Rational" / 
		"Q" / 
		"Integer" / 
		"Int" / 
		"Z" / 
		"Natural" / 
		"N" / 
		"Boolean" / 
		"Bool" / 
		"String" / 
		"Str" / 
		"void") { return new AST.TypeAST(left); }


number
	= digits:[0-9]+ {
		return new AST.NumberLiteral(parseInt(digits.join(""), 10));
	}
	/ firstPart:[0-9]* "." secondPart:[0-9]+ { 
		let digits = parseInt(firstPart.join("")+"."+secondPart.join(""), 10);
		return new AST.NumberLiteral(digits);
	}


_ "whitespace"
	= [ \t\r\n]*

__ "essential whitespace"
	= [ \t\r\n]+