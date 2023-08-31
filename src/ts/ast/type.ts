import { divides, gcd } from "../utils.js";

export const enum TypeEnum {
	OBJECT = 1,
	FORMULA = 2,
	REAL = 2 * 2,
	RATIONAL = 2 * 2 * 2,
	INTEGER = 2 * 2 * 2 * 2,
	NATURAL = 2 * 2 * 2 * 2 * 2,
	BOOLEAN = 2 * 2 * 2 * 2 * 2 * 2,
	STRING = 2 * 3,
	VOID = 5,
	MAP = 7,
	DUMMY = 23456789,
}

export class TypeAST {
	name: string;
	type: TypeEnum;

	constructor(name: string | number) {
		this.name = "uncertain";

		if (typeof name == "number") {
			this.type = <TypeEnum>name;
			return;
		}

		switch (<string>name) {
			case "Object":
			case "Obj":
				this.type = TypeEnum.OBJECT;
				this.name = "ObjType";
				break;
			case "Formula":
			case "Form":
				this.type = TypeEnum.FORMULA;
				this.name = "FormType";
				break;
			case "Real":
			case "R":
				this.type = TypeEnum.REAL;
				this.name = "RealType";
				break;
			case "Rational":
			case "Q":
				this.type = TypeEnum.RATIONAL;
				this.name = "RatType";
				break;
			case "Integer":
			case "Int":
			case "Z":
				this.type = TypeEnum.INTEGER;
				this.name = "IntType";
				break;
			case "Natural":
			case "N":
				this.type = TypeEnum.NATURAL;
				this.name = "NatType";
				break;
			case "Boolean":
			case "Bool":
				this.type = TypeEnum.BOOLEAN;
				this.name = "BoolType";
				break;
			case "String":
			case "Str":
				this.type = TypeEnum.STRING;
				this.name = "StrType";
				break;
			case "void":
				this.type = TypeEnum.VOID;
				this.name = "VoidType";
				break;
			case "Map":
				this.type = TypeEnum.MAP;
				this.name = "MapType";
				break;
			case "dummy":
			case "Dummy":
				this.type = TypeEnum.DUMMY;
				this.name = "DummyType";
				break;
			default:
				this.type = TypeEnum.DUMMY;
				this.name = "ErrorType";
				throw new Error("Bestie idk what the type " + name + " is");
			//break;
		}
	}

	instanceOf(t: TypeAST | number): boolean {
		if (t instanceof TypeAST) return divides(t.type, this.type);

		return divides(t, this.type);
	}

	closestParent(t: TypeAST | number): TypeAST {
		if (t instanceof TypeAST) return new TypeAST(gcd(this.type, t.type));
		return new TypeAST(gcd(this.type, t));
	}

	isMathType(): boolean {
		return this.type % TypeEnum.REAL == 0;
	}

	isFunction(): boolean {
		return this.type % TypeEnum.MAP == 0;
	}

	toString(): string {
		return `${this.name}()`;
	}
}

export class FunctionType extends TypeAST {
	domain: TypeAST;
	codomain: TypeAST;

	constructor(domain: TypeAST, codomain: TypeAST) {
		super("Map");
		this.domain = domain;
		this.codomain = codomain;
	}
}
