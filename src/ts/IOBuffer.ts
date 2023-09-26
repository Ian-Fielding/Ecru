import { EcruError, StackOverflowError, ThrowableEcruError } from "./error.js";

const MAX_RECURSION_DEPTH = 350,
	MAX_DISPLAY_OF_STACK_TRACE = 10;

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

	stack: string[];

	constructor(out: (a: string) => void, err: (b: string) => void) {
		this.out = out;
		this.err = err;

		this.stack = [];

		this.outHistory = [];
		this.errHistory = [];
	}

	pushStack(input: string): void {
		this.stack.push(input);
		if (this.stack.length > MAX_RECURSION_DEPTH)
			this.throwError(new StackOverflowError(MAX_RECURSION_DEPTH));
	}

	popStack(): string {
		return this.stack.pop()!;
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

		let stacktrace: string[] = [];
		let extra: number = this.stack.length - MAX_DISPLAY_OF_STACK_TRACE;

		for (let i = this.stack.length - 1; i >= Math.max(0, extra); i--)
			stacktrace.push(`      --> ${this.stack[i]}`);

		if (extra > 0) stacktrace.push(`... (${extra} more).\n`);
		let throwable: ThrowableEcruError = new ThrowableEcruError(
			err,
			stacktrace
		);

		throw throwable;
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
		this.stack = [];
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
