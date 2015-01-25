#! /usr/bin/node

var typ = require("./representation.js");
var parse = require("./parse.js");
var tokenizer = require("./tokenize.js");
var pprint = require("./pprint.js");
var env = require("./environments.js");


//var istr = fs.readFileSync('/dev/stdin').toString();
//var istr = "if true then (+ 6 (a+a*b)) else 1";
var istr = "(+ 3 12)"
var ast = parse.parseFull(tokenizer.tokenize(istr));

function apply(func, p) {
  return func(p);
}

function evaluateAll(ast, environment) {
  var l = ast.length;
  var evaled = [];
  for (var i = 0; i < l; i++) {
    // should look for closures?
    evaled.push(evaluate(ast[i], environment));
  }
  return evaled;
}

function evaluate(ast, environment) {
  if (ast.exprType == "Application") {
    return apply(evaluate(ast.func, environment), evaluate(ast.p, environment));
  }
  else if (ast.exprType === "Unary") { /* Unary function application */
    return apply(evaluate(ast.op, environment), evaluate(ast.val, environment));
  }
  else if (ast.exprType === "Name") {
    //console.log(env.lookup(ast.ident, environment));
    return env.lookup(ast.ident, environment);
  }
  else if (ast.exprType === "If") {
    if (evaluate(ast.condition, environment)) {
      return evaluate(ast.thenexp, environment);
    }
    else {
      return evaluate(ast.elseexp, environment);
    }
  }
  else if (ast.exprType === "Definition") {
    // put it in the environment
    return ast;
  }
  else if (ast.exprType === "Closure") {
    // Get the values of the free variables
    // Throw an unbound error if one is unbound
    // Traverse the function part of the closure and replace instances of the free
    // variables with instances of a record offset in the environment
    return ast;
  }
  else {
    return ast;
  }
}
var testenv = env.makeEnv("toplevel",
                      [
                       ["+", function(a) { return function(b) { return a + b; } }],
                       ["*", function(a) { return function(b) { return a * b; } }],
                       ["a", 2],
                       ["b", 3]]);

var all = evaluate(ast[0][ast[0].length - 1], testenv);
console.log(JSON.stringify(all, null, 4));
//console.log(JSON.stringify(ast, null, 4));
//console.log("%j", testenv);
//console.log("%j", ast[0][ast[0].length - 1]);
//console.log("%j", ast[0][ast[0].length - 1]);
