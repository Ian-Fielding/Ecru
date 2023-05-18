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
	"log_",
	"ln",
	"sin",
	"cos",
	"tan",
	"sec",
	"csc",
	"cot",
	"invsin",
	"invcos",
	"invtan",
	"invsec",
	"invcsc",
	"invtan",
	"sinh",
	"cosh",
	"tanh",
	"sech",
	"csch",
	"coth",
	"invsinh",
	"invcosh",
	"invtanh",
	"invsech",
	"invcsch",
	"invtanh"
];

const punctuation=[
    ",",
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

		let arr=[];
		iloop:for(let i=0;i<input.length;i++){
			let key=this.greedyGet(input,i);
			if(key.length!=0){
				arr.push(new Token(key,key));
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
			arr=[];
			break;


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

}

function butClicked(){
	let val=document.getElementById("cont");
	let scan=new Scanner(val.value.replace(/\s/g,''));

	console.log(scan.toString());
}