export interface Test {
	name: string;
	input: string;
	out: string;
	err: boolean;
	errmsg?: string;
}

export let tests: Test[] = [
	{
		name: "basic_test1",
		input: "",
		out: "",
		err: false,
	},
	{
		name: "basic_test2",
		input: 'print "hello world";',
		out: "hello world",
		err: false,
	},
	{
		name: "basic_test3",
		input: "print 1+2+3;",
		out: "6",
		err: false,
	},
	{
		name: "basic_test4",
		input: "print 1+2-3;",
		out: "0",
		err: false,
	},
	{
		name: "basic_test5",
		input: "print 1-2-3;",
		out: "-4",
		err: false,
	},
	{
		name: "basic_test6",
		input: "print 1+2*3;",
		out: "7",
		err: false,
	},
	{
		name: "basic_test7",
		input: "print 4/2+1;",
		out: "3",
		err: false,
	},
	{
		name: "basic_test8",
		input: 'print "hello";\n\n print " world";',
		out: "hello world",
		err: false,
	},
	{
		name: "basic_test9",
		input: 'println "hello"; \n \n \n \t print "world";',
		out: "hello\nworld",
		err: false,
	},
	{
		name: "basic_test10",
		input: "x: Z = 3; y: Z = 4; print x+y;",
		out: "7",
		err: false,
	},
	{
		name: "basic_test11",
		input: "x: Z; y: Z = 3; x=y; print 2*x + y;",
		out: "9",
		err: false,
	},
	{
		name: "basic_test12",
		input: "x: Z = 4; y: Z = 5; x=1; y=0; y=x; x=y; print x+y;",
		out: "2",
		err: false,
	},
	{
		name: "basic_test13",
		input: "x=3;",
		out: "",
		err: true,
	},
	{
		name: "basic_test14",
		input: "x: Z;",
		out: "",
		err: false,
	},
	{
		name: "basic_test15",
		input: "x:Z = 3",
		out: "",
		err: true,
	},
	{
		name: "basic_test16",
		input: "3;",
		out: "",
		err: false,
	},
	{
		name: "basic_test17",
		input: 'x: Z = 10; y: Z = 20; print (x==y) + " " +(x+10==y);',
		out: "0 1",
		err: false,
	},
	{
		name: "basic_test18",
		input: 'print " abc \n \t ";',
		out: " abc \n \t ",
		err: false,
	},
	{
		name: "add1",
		input: "print 1+(2+3);",
		out: "6",
		err: false,
	},
	{
		name: "add2",
		input: ' print 1 + ( 2 + 3 ) + 4 + 5 ; print " " ; print ( 4 + 3 ) + ( 3 + 4 ) ; ',
		out: "15 14",
		err: false,
	},
	{
		name: "add3",
		input: "x: Z; y: Z; ans: Z; x=10; y=20; ans = x + y ; print ans;",
		out: "30",
		err: false,
	},
	{
		name: "add4",
		input: "abc: Z = 100 + 70; print abc;",
		out: "170",
		err: false,
	},
	{
		name: "add4.1",
		input: "abc: Z; abc=100+70; print abc;",
		out: "170",
		err: false,
	},
	{
		name: "add5",
		input: `
			a: Z;
			ccv: Z;
			b: Z;
			c: Z;
			d: Z;
			e: Z;
			a = 10009;
		    b = a + 100000;
		    c = b + a + (100000 + 100000) + 200;
		    print a + " ~ " + b + " ~ " + c;
		`,
		out: "10009 ~ 110009 ~ 320218",
		err: false,
	},
	{
		name: "func_test1",
		input: "f(){}",
		out: "",
		err: true,
	},
	{
		name: "func_test2",
		input: "f():void{}",
		out: "",
		err: false,
	},
	{
		name: "func_test3",
		input: "f():Z {}",
		out: "",
		err: true,
	},
	{
		name: "func_test3.1",
		input: "f():Z {} f();",
		out: "",
		err: true,
	},
	{
		name: "func_test4",
		input: "f():Z {return 5;} \n print f();",
		out: "5",
		err: false,
	},
	{
		name: "func_test5",
		input: 'f():Z {if 0 {return 3;} print "Uh oh";} print f();',
		out: "",
		err: true,
	},
	{
		name: "func_test6",
		input: "f(x:Z):void {} ",
		out: "",
		err: false,
	},
	{
		name: "func_test7",
		input: 'f():void {print "Cool test!"; return;} f();',
		out: "Cool test!",
		err: false,
	},

	{
		name: "func_test7.1",
		input: 'f(x:Z):void {print "Cool test!"; return;} f(3);',
		out: "Cool test!",
		err: false,
	},
	{
		name: "func_test7.2",
		input: 'f(x:Z):Z {print "Cool test!\n"; return x+1;} print f(3);',
		out: "Cool test!\n4",
		err: false,
	},
	{
		name: "func_test8",
		input: "f(); f():void {}",
		out: "",
		err: true,
	},
	{
		name: "func_test9",
		input: `f(x:Z):Z{
					y:Z = 3;
					return x+y;
				}

				g(y:Z,x:Z):Z{
					return x*x+y*y;
				}

				h():Z {
					return 7;
				}

				print g(h(),f(h()));`,
		out: "149",
		err: false,
	},
	{
		name: "func_test10",
		input: "fgh(x:Z,y:Z,z:Z):void {return;} fgh(1,2,3);",
		out: "",
		err: false,
	},
	{
		name: "func_test11",
		input: "fgh(x:Z,y:Z,z:Z):void {return;} fgh(1,2);",
		out: "",
		err: true,
	},
	{
		name: "func_test12",
		input: "fgh(x:Z,y:Z,z:Z):void {return;} fgh();",
		out: "",
		err: true,
	},
	{
		name: "func_test13",
		input: "fgh(x:Z):void {return;} fgh(1,2,3);",
		out: "",
		err: true,
	},
	{
		name: "func_test14",
		input: "fgh(x:Z):void {return;} fgh();",
		out: "",
		err: true,
	},
	{
		name: "func_test15",
		input: "fgh(x:Z):void {return;} fgh(1);",
		out: "",
		err: false,
	},
	{
		name: "func_test16",
		input: "fgh():void {return;} fgh(1,2,3);",
		out: "",
		err: true,
	},
	{
		name: "func_test17",
		input: "fgh(x:Z):void {return;} fgh(1);",
		out: "",
		err: false,
	},
	{
		name: "func_test18",
		input: "fgh():void {return;} fgh();",
		out: "",
		err: false,
	},
	{
		name: "func_test19",
		input: "fgh(x:Z,y:Z,z:Z):void {return;} x=3;",
		out: "",
		err: true,
	},

	{
		name: "func_test20",
		input: "f(x:Z):Z {b:Z = 3; b=x; return b;} print f(4);",
		out: "4",
		err: false,
	},
];
