export let basicTests = [
    {
        name: 'basic_test1',
        input: '',
        out: '',
        err: false,
    }, {
        name: 'basic_test2',
        input: 'print "hello world";',
        out: 'hello world',
        err: false,
    }, {
        name: 'basic_test3',
        input: 'print 1+2+3;',
        out: '6',
        err: false,
    }, {
        name: 'basic_test4',
        input: 'print 1+2-3;',
        out: '0',
        err: false,
    }, {
        name: 'basic_test5',
        input: 'print 1-2-3;',
        out: '-4',
        err: false,
    }, {
        name: 'basic_test6',
        input: 'print 1+2*3;',
        out: '7',
        err: false,
    }, {
        name: 'basic_test7',
        input: 'print 4/2+1;',
        out: '3',
        err: false,
    }, {
        name: 'basic_test8',
        input: 'print "hello";\n\n print " world";',
        out: 'hello world',
        err: false,
    }, {
        name: 'basic_test9',
        input: 'println "hello"; \n \n \n \t print "world";',
        out: 'hello\nworld',
        err: false,
    }, {
        name: 'basic_test10',
        input: 'x: Z = 3; y: Z = 4; print x+y;',
        out: '7',
        err: false,
    }, {
        name: 'basic_test11',
        input: 'x: Z; y: Z = 3; x=y; print 2*x + y;',
        out: '9',
        err: false,
    }, {
        name: 'basic_test12',
        input: 'x: Z = 4; y: Z = 5; x=1; y=0; y=x; x=y; print x+y;',
        out: '2',
        err: false,
    }, {
        name: 'basic_test13',
        input: 'x=3;',
        out: '',
        err: true,
    }, {
        name: 'basic_test14',
        input: 'x: Z;',
        out: '',
        err: false,
    }, {
        name: 'basic_test15',
        input: 'x:Z = 3',
        out: '',
        err: true,
    }, {
        name: 'basic_test16',
        input: '3;',
        out: '',
        err: false,
    }, {
        name: 'basic_test17',
        input: 'x: Z = 10; y: Z = 20; print (x==y) + " " +(x+10==y);',
        out: '0 1',
        err: false,
    }, {
        name: 'add1',
        input: 'print 1+(2+3);',
        out: '6',
        err: false,
    }, {
        name: 'add2',
        input: ' print 1 + ( 2 + 3 ) + 4 + 5 ; print " " ; print ( 4 + 3 ) + ( 3 + 4 ) ; ',
        out: '15 14',
        err: false,
    }, {
        name: 'add3',
        input: 'x: Z; y: Z; ans: Z; x=10; y=20; ans = x + y ; print ans;',
        out: '30',
        err: false,
    }, {
        name: 'add4',
        input: 'abc: Z = 100 + 70; print abc;',
        out: '170',
        err: false,
    }, {
        name: 'add4.1',
        input: 'abc: Z; abc=100+70; print abc;',
        out: '170',
        err: false,
    }, {
        name: 'add5',
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
        out: '10009 ~ 110009 ~ 320218',
        err: false,
    }, {
        name: 'basic_test24',
        input: '',
        out: '',
        err: false,
    }, {
        name: 'basic_test25',
        input: '',
        out: '',
        err: false,
    }, {
        name: 'basic_test26',
        input: '',
        out: '',
        err: false,
    },
];
