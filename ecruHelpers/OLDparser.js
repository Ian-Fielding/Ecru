import { Func, NumberLiteral, Id, PatternExpression, PatternInteger, Binding } from "/ecruHelpers/asts.js";
import { parse } from "/ecruHelpers/parser/expressionParser.js";
console.log(parse("--3^2!!!").toString())

const keywords=[
	"add",
	"sub",
	"mul",
	"div",
	"pow",
	"root",
	"sqrt",
	"sum",
	"prod",
	"log",
	"ln",
	"sin",
	"cos",
	"tan",
	"sec",
	"csc",
	"cot",
	"arcsin",
	"arccos",
	"arctan",
	"arcsec",
	"arccsc",
	"arctan",
	"sinh",
	"cosh",
	"tanh",
	"sech",
	"csch",
	"coth",
	"arcsinh",
	"arccosh",
	"arctanh",
	"arcsech",
	"arccsch",
	"arctanh",


	"eval_add",
	"eval_negate",
	"eval_multiply",
	"eval_pow"
];

const punctuation=[
    "*",
    "/",
    "+",
    "-",
    "^",
    "(",
    ")",
    "!",
    ","
];

const patterns=[
	"E_",
	"E",
	"k_",
	"k",
];

class Token {
	constructor(type,value){
		this.type=type;
		this.value=value;
	}

	toString(){
		return `Token( ${this.type}, ${this.value} )`;
	}
}

class Scanner {
	constructor(input,isPatterns=false){
		this.input=input;
		this.error=false;
		this.isPatterns=isPatterns;

		let arr=[];
		iloop:for(let i=0;i<input.length;i++){
			let key=this.greedyGet(input,i);
			if(key.length!=0){

				arr.push(new Token(this.isPatterns&&patterns.includes(key)?"pattern":"func",key));
				i+=key.length-1;
				continue;
			}

			key = input.substring(i,i+1);
			if(punctuation.includes(key)){
				arr.push(new Token(key,key));
				continue;
			}

			if(key.match(/[a-z]/i)){
				arr.push(new Token("ID",key));
				continue;
			}

			let next=input.substring(i+1,i+2);
			if(key=="." && !next.match(/[0-9]/i)){
				console.log("Scanner error!! Unexpected token "+key);
				this.error=true;
				arr=[];
				break;
			}
			

			if(key=="." || key.match(/[0-9]/i))
				for(let j=i+1;j<=input.length+1;j++){
					let str=input.substring(i,j);
					if(j==input.length+1){
						arr.push(new Token("NUM",str));
						i=j-1;
						continue iloop;
					}

					if(isNaN(str)){
						arr.push(new Token("NUM",input.substring(i,j-1)));
						i=j-2;
						continue iloop;
					}

				}

			console.log("Scanner error!! Unexpected token "+key);
			this.error=true;
			arr=[];
			break;


		}

		// superposition multiply

		let isLTerminal = x => x=="NUM" || x=="ID" || x==")" || x=="pattern";
		let isRTerminal = x => x=="NUM" || x=="ID" || x=="func" || x=="(" || x=="pattern";

		for(let i=0;i<arr.length-1;i++){
			let t1=arr[i].type;
			let t2=arr[i+1].type;
			if(isLTerminal(t1) && isRTerminal(t2)){
				if(t1!="pattern" || t2!="NUM" ||arr[i].length==1){
					arr.splice(i+1,0,new Token("*","*"));
					i--;
				}
				
			}
			
		}


		this.arr=arr;
		this.count=0;
	}

	greedyGet(input,i){
		let minstr="";
		let len=-1;
		for(const elem of keywords){
			let newLen=elem.length;
			if(len < newLen && input.substring(i,i+newLen)==elem){
				minstr=elem;
				len = newLen;
			}
		}

		if(!this.isPatterns)
			return minstr;

		for(const elem of patterns){
			let newLen=elem.length;
			if(len < newLen && input.substring(i,i+newLen)==elem){
				minstr=elem;
				len = newLen;
			}
		}

		return minstr;
	}

	peek(){
		if(this.arr.length <= this.count)
			return new Token("EOF","EOF");

		return this.arr[this.count];
	}

	consume(){
		if(this.arr.length <= this.count)
			return new Token("EOF","EOF");

		return this.arr[this.count++];
	}

	toString(){
		let str=`Tokens for ${this.input}:`;
		for(const elem of this.arr){
			str+=`\n -- ${elem}`;
		}
		return str;
	}
}




class Parser{
	constructor(input,isPatterns=false){
		this.scanner=new Scanner(input,isPatterns);
		this.patternVars=new Set();
		if(!this.scanner.error){
			this.error=false;
			this.root=this.expr1();	
		} else{
			this.error=true;
			this.root=null;
		}
			
	}

	current(){
		return this.scanner.peek().type;
	}

	match(type){
		if(this.current() == type)
			return this.scanner.consume();

		console.log(`Parser error!! Expected type ${type} but saw ${this.current()}`);
		this.error=true;
		return this.scanner.peek();
	}

	//,
	expr0(){
		let left=[this.expr1()];
		while(this.current()==","){
			this.match(",");
			let right=this.expr1();
			left.push(right);
		}

		return left;
	}

	// +,-
	expr1(){
		let left=this.expr2();
		while(["+","-"].includes(this.current())){
			let op=this.match(this.current()).value;
			let right=this.expr2();

			if(op=="+")
				left = new Func("add",[left,right]);
			else
				left = new Func("sub",[left,right]);
		}

		return left;
	}

	// *,/
	expr2(){
		let left=this.expr2_5();
		while(["*","/"].includes(this.current())){
			let op=this.match(this.current()).value;
			let right=this.expr2_5();

			if(op=="*")
				left = new Func("mul",[left,right]);
			else
				left = new Func("div",[left,right]);
		}

		return left;
	}


	// ^
	expr2_5(){
		let left=this.expr3();
		while(this.current() == "^"){
			this.match("^");
			let right=this.expr3();

			left = new Func("pow",[left,right]);
		}

		return left;
	}



	// unary neg
	expr3(){
		if(this.current() != "-")
			return this.expr4();

		this.match("-");
		return new Func("neg",[this.expr3()]);
	}

	// (...), built-in funcs
	expr4(){

		let expr=null;
		if(this.current() == "("){
			this.match("(");
			expr=this.expr1();
			this.match(")");
		}

		else if(this.current() == "func"){
			let val=this.match("func").value;

			if(this.current() == "("){
				this.match("(");
				expr=new Func(val,this.expr0());
				this.match(")");
			}else{
				expr = new Func(val,[this.expr2()]);
			}
		}

		else if(this.current() == "pattern"){
			let name=this.match("pattern").value;
			switch(name){
			case "E":
				expr=new PatternExpression(1);
				break;
			case "E_":
				expr=new PatternExpression(this.match("NUM").value);
				break;
			case "k":
				expr=new PatternInteger(1);
				break;
			case "k_":
				expr=new PatternInteger(this.match("NUM").value);
				break;
			}

			this.patternVars.add(expr.name);
		}

		else if(this.current()=="ID"){
			expr = new Id(this.match(this.current()).value);
		}

		else if(this.current() == "NUM"){
			expr = new NumberLiteral(this.match(this.current()).value);
		}

		if(expr == null){
			console.log(`Parser error!! expr is null, while current is ${this.current()}`);
			this.error=true;
		}

		return expr;
	}

	toLatex(){
		if(this.error)
			return "";
		return this.root.toLatex();
	}

	checkPattern(patternParse,history){

		let bind = new Binding(patternParse.patternVars,history)
		if(this.root.checkPattern(patternParse.root,bind))
			return bind;
		return null;
	}

	applyPattern(patternParse1,patternParse2,history,depth=1){
		let bind=this.checkPattern(patternParse1,history);
		if(bind==null)
			return {bind: null, root: null};


		let binded1=patternParse1.root.applyBind(bind);
		let binded2=patternParse2.root.applyBind(bind);		
		
		console.log(`Checking bind for depth ${depth}.`);
		console.log(bind);
		console.log(binded1);
		console.log(binded2);
		console.log("Going down.");
		
		let newRoot=this.root.applyPattern(binded1,binded2);

		console.log("It works.");
		
		return {bind: bind, root: newRoot};
	}

	getAllPatterns(str){
		let arr=str.replace(/\s/g,'').split("->");
		let patternParse1=new Parser(arr[0],true);
		let patternParse2=new Parser(arr[1],true);

		let history=[];
		let patterns=[];

		let obj={bind: "filler"};
		let i=0;
		while(obj.bind!=null && i<10){
			obj=this.applyPattern(patternParse1,patternParse2,history,1);

			if(obj.bind==null)
				continue;
			
			history.push(obj.bind);
			patterns.push(obj);

			i++;
		}
		
		return patterns;
	}
}


document.getElementById("but").onclick=function(){
	let outputStr="";

	let str=document.getElementById("editor").value.replace(/\s/g,'');
	let parser=new Parser(str);
	if(parser.error){
		document.getElementById("bot").innerHTML="PARSE ERROR!";
		return;
	}
	outputStr+=`The expression is $$${parser.toLatex()}$$`;

	let patternstr=document.getElementById("pattern1").value.replace(/\s/g,'');
	let patterns=parser.getAllPatterns(patternstr);
	outputStr+=`There ${patterns.length==1? "is":"are"} ${patterns.length} total match${patterns.length==1?"":"es"}:<hr>`;

	for(let i=0;i<patterns.length;i++){
		let bind=patterns[i].bind;
		let root=patterns[i].root;

		outputStr+=`There is a match given by $${bind.toLatex()}$ and the resulting replacement is $$${root.toLatex()}$$<hr>`
	}


	document.getElementById("bot").innerHTML=outputStr;
	MathJax.typeset();
}


//var quill = new Quill('#editor', {
//	theme: 'snow'
//});