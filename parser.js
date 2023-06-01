import { Func, NumberLiteral, Id } from "/projects/ecru/asts.js";

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
	"arctanh"
];

const punctuation=[
    "*",
    "/",
    "+",
    "-",
    "^",
    "(",
    ")",
    "!"
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
	constructor(input){
		this.input=input;
		this.error=false;

		let arr=[];
		iloop:for(let i=0;i<input.length;i++){
			let key=this.greedyGet(input,i);
			if(key.length!=0){
				arr.push(new Token("func",key));
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
				console.log("Error!! Unexpected token "+key);
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

			console.log("Error!! Unexpected token "+key);
			this.error=true;
			arr=[];
			break;


		}

		// superposition multiply

		let isLTerminal = x => x=="NUM" || x=="ID" || x==")";
		let isRTerminal = x => x=="NUM" || x=="ID" || x=="func" || x=="(";

		for(let i=0;i<arr.length-1;i++){
			let t1=arr[i].type;
			let t2=arr[i+1].type;
			if(isLTerminal(t1) && isRTerminal(t2)){
				arr.splice(i+1,0,new Token("*","*"));
				i--;
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
	constructor(input){
		this.scanner=new Scanner(input);
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

		console.log(`Error! Expected type ${type} but saw ${this.current()}`);
		this.error=true;
		return this.scanner.peek();
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
				expr=new Func(val,[this.expr1()]);
				this.match(")");
			}else{
				expr = new Func(val,[this.expr2()]);
			}
		}

		else if(this.current()=="ID"){
			expr = new Id(this.match(this.current()).value);
		}

		else if(this.current() == "NUM"){
			expr = new NumberLiteral(this.match(this.current()).value);
		}

		if(expr == null){
			console.log(`Error!! expr is null, while current is ${this.current()}`);
			this.error=true;
		}

		return expr;
	}

	toLatex(){
		if(this.error)
			return "";
		return `$$${this.root.toLatex()}$$`;
	}
}

document.getElementById("but").onclick=function(){
	let str=document.getElementById("cont").value.replace(/\s/g,'');

	let parser=new Parser(str);
	
	console.log(parser)

	if(parser.error){
		document.getElementById("text").innerHTML="PARSE ERROR!";
	}else{
		document.getElementById("text").innerHTML=parser.toLatex();
	}

	MathJax.typeset();
}
