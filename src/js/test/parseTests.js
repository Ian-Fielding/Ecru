export let parseTests = [
    {
        name: 'parse_test1',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test2',
        input: 'x: Integer;',
        expected: 'Program(DeclStmt(x,IntType()))',
    }, {
        name: 'parse_test3',
        input: 'x;',
        expected: 'Program(x)',
    }, {
        name: 'parse_test4',
        input: 'x;y;    \n \n \t \n z \t \t;  \t\t\t\t\t\t\t',
        expected: 'Program(x,y,z)',
    }, {
        name: 'parse_test5',
        input: 'x = 3;',
        expected: 'Program(AssignStmt(x,3))',
    }, {
        name: 'parse_test6',
        input: '\nxz : String\n   \t = 3+4;',
        expected: 'Program(DeclStmt(xz,StrType()),AssignStmt(xz,add(3,4)))',
    }, {
        name: 'parse_test7',
        input: 'x',
        expected: 'Error',
    }, {
        name: 'parse_test8',
        input: '3*x*x+4*y-3*x-4;',
        expected: 'Program(sub(sub(add(mul(mul(3,x),x),mul(4,y)),mul(3,x)),4))',
    }, {
        name: 'parse_test9',
        input: 'print\nx;',
        expected: 'Program(PrintStmt(x))',
    }, {
        name: 'parse_test10',
        input: '\n\n\npprint(x+x);',
        expected: 'Program(PrettyPrintStmt(add(x,x)))',
    }, {
        name: 'parse_test11',
        input: '\n  // This is a test \nx: Z;',
        expected: 'Program(CommentStmt("This is a test"),DeclStmt(x,IntType()))',
    }, {
        name: 'parse_test12',
        input: '\n x: Z = 3; if(x){print "test";}',
        expected: 'Program(DeclStmt(x,IntType()),AssignStmt(x,3),IfStmt(x,PrintStmt("test")))',
    }, {
        name: 'parse_test13',
        input: 'if 1+1 {x: Z;} else {x: Z;}',
        expected: 'Program(IfStmt(add(1,1),DeclStmt(x,IntType()),DeclStmt(x,IntType())))',
    }, {
        name: 'parse_test14',
        input: 'foo: String = "hello world";',
        expected: 'Program(DeclStmt(foo,StrType()),AssignStmt(foo,"hello world"))',
    }, {
        name: 'parse_test15',
        input: 'x += 1/1;',
        expected: 'Program(AssignStmt(x,add(x,div(1,1))))',
    }, {
        name: 'parse_test16',
        input: 'x -= 1+1;',
        expected: 'Program(AssignStmt(x,sub(x,add(1,1))))',
    }, {
        name: 'parse_test17',
        input: 'x *= 1-1;',
        expected: 'Program(AssignStmt(x,mul(x,sub(1,1))))',
    }, {
        name: 'parse_test18',
        input: 'x /= 1*1;',
        expected: 'Program(AssignStmt(x,div(x,mul(1,1))))',
    }, {
        name: 'parse_test19',
        input: 'x: Z; /* This is a cool comment! */ x = 3;',
        expected: 'Program(DeclStmt(x,IntType()),CommentStmt("This is a cool comment!"),AssignStmt(x,3))',
    }, {
        name: 'parse_test20',
        input: 'while 0 {x: Z; y:String;}',
        expected: 'Program(WhileLoop(0,DeclStmt(x,IntType()),DeclStmt(y,StrType())))',
    }, {
        name: 'parse_test21',
        input: 'while(x and y){}',
        expected: 'Program(WhileLoop(and(x,y)))',
    }, {
        name: 'parse_test22',
        input: 'for x: Z = 1;x ~= 5; x+=1 {print "hello";}',
        expected: 'Program(ForLoop(DeclStmt(x,IntType()),AssignStmt(x,1),not(equals(x,5)),AssignStmt(x,add(x,1)),PrintStmt("hello")))',
    }, {
        name: 'parse_test23',
        input: 'for ( x: Z = 1;x ~= 5; x+=1 ) {print "hello";}',
        expected: 'Program(ForLoop(DeclStmt(x,IntType()),AssignStmt(x,1),not(equals(x,5)),AssignStmt(x,add(x,1)),PrintStmt("hello")))',
    }, {
        name: 'parse_test24',
        input: '0 && 1 || 2 && 3;',
        expected: 'Program(or(and(0,1),and(2,3)))',
    }, {
        name: 'parse_test25',
        input: '0 || 1 && 2 || 3;',
        expected: 'Program(or(or(0,and(1,2)),3))',
    }, {
        name: 'parse_test26',
        input: '1+2+3;',
        expected: 'Program(add(add(1,2),3))',
    }, {
        name: 'parse_test27',
        input: '1-2-3;',
        expected: 'Program(sub(sub(1,2),3))',
    }, {
        name: 'parse_test28',
        input: '1*2*3;',
        expected: 'Program(mul(mul(1,2),3))',
    }, {
        name: 'parse_test29',
        input: '1/2/3;',
        expected: 'Program(div(div(1,2),3))',
    }, {
        name: 'parse_test30',
        input: '(1 && 2 || 3) == 4 == 5;',
        expected: 'Program(equals(equals(or(and(1,2),3),4),5))',
    }, {
        name: 'parse_test31',
        input: '1 ~= 4;',
        expected: 'Program(not(equals(1,4)))',
    }, {
        name: 'parse_test32',
        input: '~1 && ~2 || ~3;',
        expected: 'Program(or(and(not(1),not(2)),not(3)))',
    }, {
        name: 'parse_test33',
        input: '// This is a test ',
        expected: 'Program(CommentStmt("This is a test"))',
    }, {
        name: 'parse_test34',
        input: '// c1\nx:Z;// c2',
        expected: 'Program(CommentStmt("c1"),DeclStmt(x,IntType()),CommentStmt("c2"))',
    }, {
        name: 'parse_test35',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test36',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test37',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test38',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test39',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test40',
        input: '',
        expected: 'Program()',
    },
];
