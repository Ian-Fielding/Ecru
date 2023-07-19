# compiles .pegjs files
# peggy --format es --trace .\ecruHelpers\parser\parser.pegjs
peggy --format es .\ecruHelpers\parser\parser.pegjs

$JSImport1 = 'import * as AST from "/ecruHelpers/ast/asts.js";'
$JSImport2 = 'import * as UTIL from "/ecruHelpers/utils.js";'

$Cont = Get-Content -Path .\ecruHelpers\parser\parser.js
Clear-Content -Path .\ecruHelpers\parser\parser.js
Add-Content -Path .\ecruHelpers\parser\parser.js -Value $JSImport1
Add-Content -Path .\ecruHelpers\parser\parser.js -Value $JSImport2
Add-Content -Path .\ecruHelpers\parser\parser.js -Value $Cont
