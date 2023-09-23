import { PRIMES } from "./utils.js";

export class Shorthand {
	static dict: Map<number, number[]> = new Map<number, number[]>();
	shorthand: number[];
	constructor(val: number | number[]) {
		if (typeof val == "number") {
			val = Math.floor(val);

			Shorthand.addToDict(val);

			this.shorthand = Shorthand.dict.get(val)!;
		} else {
			this.shorthand = val;
		}
	}

	equals(other: Shorthand): boolean {
		if (this.shorthand.length != other.shorthand.length) return false;

		for (let i = 0; i < this.shorthand.length; i++)
			if (this.shorthand[i] != other.shorthand[i]) return false;
		return true;
	}

	gcd(other: Shorthand): Shorthand {
		let gcd: number[] = [];
		let a: number = 0,
			b: number = 0;
		while (a < this.shorthand.length && b < other.shorthand.length) {
			let x: number = this.shorthand[a];
			let y: number = other.shorthand[b];

			if (x < y) {
				a += 2;
			} else if (x > y) {
				b += 2;
			} else {
				let min = Math.min(
					this.shorthand[a + 1],
					other.shorthand[b + 1]
				);
				if (min > 0) gcd.push(x, min);
				a += 2;
				b += 2;
			}
		}

		return new Shorthand(gcd);
	}

	mul(other: Shorthand): Shorthand {
		let product: number[] = [];
		let a: number = 0,
			b: number = 0;
		while (a < this.shorthand.length || b < other.shorthand.length) {
			if (a >= this.shorthand.length) {
				product.push(other.shorthand[b], other.shorthand[b + 1]);
				b += 2;
				continue;
			}
			if (b >= other.shorthand.length) {
				product.push(this.shorthand[a], this.shorthand[a + 1]);
				a += 2;
				continue;
			}

			let x: number = this.shorthand[a];
			let y: number = other.shorthand[b];

			if (x < y) {
				product.push(this.shorthand[a], this.shorthand[a + 1]);
				a += 2;
			} else if (x > y) {
				product.push(other.shorthand[b], other.shorthand[b + 1]);
				b += 2;
			} else {
				product.push(x, this.shorthand[a + 1] + other.shorthand[b + 1]);
				a += 2;
				b += 2;
			}
		}

		return new Shorthand(product);
	}

	static addToDict(val: number): void {
		if (val in this.dict) return;

		if (val == 1) {
			this.dict.set(1, []);
			return;
		}

		// check built-in list of primes
		for (let prime of PRIMES) {
			if (val % prime == 0) {
				this.addToDict_withPrime(val, prime);
				return;
			}
		}

		// check for all possible factors
		let upperBound: number = Math.ceil(Math.sqrt(val));
		for (
			let prime: number = PRIMES[PRIMES.length - 1];
			prime <= upperBound;
			prime++
		) {
			if (val % prime == 0) {
				this.addToDict_withPrime(val, prime);
				return;
			}
		}

		// otherwise, val must be prime
		this.dict.set(val, [val, 1]);
	}

	static addToDict_withPrime(val: number, prime: number): void {
		let count: number = 0;
		let exp: number = 1;
		while (val % prime == 0) {
			count++;
			exp *= prime;
			val /= prime;
		}
		this.addToDict(val);
		let partShorthand: number[] = this.dict.get(val)!;
		let short: number[] = [prime, 0].concat(partShorthand);
		for (let i: number = 0; i < count; i++) {
			short[1]++;
			val *= prime;
			this.dict.set(val, short.slice());
		}
	}

	copy(): number[] {
		let cpy: number[] = new Array(this.shorthand.length);
		for (let i = 0; i < this.shorthand.length; i++)
			cpy[i] = this.shorthand[i];
		return cpy;
	}

	getVal(index: number = 0): number {
		if (index >= this.shorthand.length) return 1;

		let val: number = 1;
		for (let i: number = 0; i < this.shorthand[index + 1]; i++)
			val *= this.shorthand[index];
		return val * this.getVal(index + 2);
	}
}
