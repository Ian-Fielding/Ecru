export class IOBuffer {
	out: (input: string) => void;
	err: (input: string) => void;
	outHistory:string[];
	errHistory:string[];

	constructor(out,err){
		this.out=out;
		this.err=err;
		this.outHistory=[];
		this.errHistory=[];
	}

	stdout(input:string):void{
		this.outHistory.push(input);
		this.out(input);
	}

	stderr(input:string):void{
		this.errHistory.push(input);
		this.err(input);
	}

	getOut():string{
		return this.outHistory.join("");
	}

	getErr():string{
		return this.errHistory.join("");
	}

	hasSeenError():boolean{
		return this.errHistory.length>0;
	}

	clear():void{
		this.outHistory=[];
		this.errHistory=[];
	}
}

function empty(input:string):void{}

export let silentBuffer: IOBuffer = new IOBuffer(empty,empty);

export let consoleBuffer: IOBuffer = new IOBuffer(console.log,console.error);