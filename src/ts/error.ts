import { Span } from "./parser/token";

export abstract class EcruError{
    name:string;
    msg:string;
    span:Span;
    constructor(name:string,msg:string,span:Span){
        this.name=name;
        this.msg=msg;
        this.span=span;
    }

    toString():string{
        return `${this.name}: `
    }
}