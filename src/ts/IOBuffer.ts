import { EcruError } from "./error";

/**
 * An abstraction of a program's input/output (IO) functionality, i.e. an extension of stdout and stderr, simply made more general
 */
export class IOBuffer {
	/**
	 * Given input string, simulates stdout (like console.log)
	 */
	out: (input: string) => void;

	/**
	 * Given input string, simulates stderr (like console.error)
	 */
	err: (input: string) => void;

	/**
	 * The history of this buffer's stdout
	 */
	outHistory: string[];

	/**
	 * The history of this buffer's stderr
	 */
	errHistory: string[];

	constructor(out: (a: string) => void, err: (b: string) => void) {
		this.out = out;
		this.err = err;

		this.outHistory = [];
		this.errHistory = [];
	}

	/**
	 * Runs stdout on an input string
	 * @param input
	 */
	stdout(input: string): void {
		this.outHistory.push(input);
		this.out(input);
	}

	/**
	 * Runs stderr on an input string
	 * @param input
	 */
	stderr(input: string): void {
		this.errHistory.push(input);
		this.err(input);
	}

	/**
	 * Throws and records an error
	 * @param err
	 */
	throwError(err: EcruError) {
		this.stderr(err.toString() + "\n");
		if (err.stack) this.stderr(err.stack);
		throw err;
	}

	/**
	 *
	 * @returns stdout as a string
	 */
	getOut(): string {
		return this.outHistory.join("");
	}

	/**
	 *
	 * @returns stderr as a string
	 */
	getErr(): string {
		return this.errHistory.join("");
	}

	/**
	 *
	 * @returns true iff stderr has been called at least once
	 */
	hasSeenError(): boolean {
		return this.errHistory.length > 0;
	}

	/**
	 * Resets this buffer
	 */
	clear(): void {
		this.outHistory = [];
		this.errHistory = [];
	}
}

function empty(input: string): void {}

/**
 * A buffer that doesn't do anything except record input
 */
export let silentBuffer: IOBuffer = new IOBuffer(empty, empty);

/**
 * A buffer that uses standard JavaScript console.log and console.error
 */
export let consoleBuffer: IOBuffer = new IOBuffer(console.log, console.error);
