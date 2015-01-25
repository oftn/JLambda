/*
 * This module takes a parse tree in a surface format
 * and transforms it into the "core" language which is
 * much simpler and easier to type-check, optimize, and evaluate
 */

var typ = require("./representation.js");
var errors = require("./errors.js");
var _ = require("underscore");

// Lists get desugared to nested function calls
// i.e. (cons (cons (cons ...)))
function desugarList(lst) {
  if (lst.xs.length <= 0) {
    return new typ.Nil();
  }
  else {
    var x = desugar(lst.xs[0]);
    var rest = lst.xs.slice(1);
    return new typ.App(new typ.App(new typ.Name("(:)"), x), desugarList(new typ.ListT(rest)));
  }
}

function desugarDefFunc(def) {
  return new typ.Def(def.ident,
                     curryFunc(def.params,
                               def.body));
}

function curryFunc(ps, body) {
  var result;
  if (_.isEmpty(ps)) {
    return desugar(body);
  }
  else {
    result = new typ.FuncT(desugar(_.first(ps)),
                         curryFunc(_.rest(ps), body));
    result.charnum = ps.charnum;
    result.linenum = ps.linenum;
    return result;
  }
}

// Take an application to a list of parameters and
// change it to fully apply a curried function
function curryApp(name, parameters) {
  if (parameters) {
    return parameters.slice(1).reduce(function(f, ident) {
      return new App(f, ident);
    }, new App(name, parameters[0]));
  }
  else {
    return new App(name);
  }
}




function desugarLet(stx) {
  var values = stx.pairs.map(desugar);
  var retval = new typ.LetExp(values, desugar(stx.body));
  return retval;
}

function sugarTypeDecl(stx) {
  var type;
  var expression;
  type = stx.p;
  expression = desugar(stx.func.p);
  expression.linenum = stx.linenum;
  expression.charnum = stx.charnum;
  return new typ.TypeDecl(expression, type);
}

function desugarDefType(stx, typeEnv) {
  var result;
  var rhs = desugar(stx.rhs);
  var name = stx.lhs.name;
  typeEnv[name] = rhs;

  result = new typ.DefType(stx.lhs, desugar(stx.rhs));
  result.linenum = stx.linenum;
  result.charnum = stx.charnum;
  return result;
}


function desugar(stx, typeEnv) {
 var typeExpTest;

 switch (stx.exprType) {
    case "If":
      if (stx.elseexp) {
        return new typ.If(desugar(stx.condition, typeEnv), desugar(stx.thenexp, typeEnv), desugar(stx.elseexp, typeEnv));
      }
      return new typ.If(desugar(stx.condition, typeEnv), desugar(stx.thenexp, typeEnv));
    case "FunctionDefinition":
      return desugarDefFunc(stx);
    case "Definition":
      return new typ.Def(stx.ident, desugar(stx.val, typeEnv));
    case "TypeDefinition":
      return desugarDefType(stx, typeEnv);
    case "Name":
      return stx;
    case "Application":
      if ((stx.func.func !== undefined ) &&
          (stx.func.func.ident === "::")) {
            /* It's a type declaration probably (will be verified later)
             * In this case we actually *add* syntax here to differentiate type declarations
             * from normal function application
             */
            typeExpTest = typ.isTypeExpr(stx.p);

            if (typeExpTest.failed !== undefined &&
                typeExpTest.failed) {
              throw errors.JInternalError(
                "Type declaration error near line " + stx.linenum + " at character #"+stx.charnum +
                "\n"+typeExpTest.stx.exprType+" (" + typeExpTest.stx.val + ") found where a type operator or type application was expected");
            }
            return sugarTypeDecl(stx);
          }

      if ((stx.func.ident === "-" ||
          stx.func.ident === "+") &&
          stx.p) {
            console.log(stx.p);
            console.log("unary operation here");
            return new typ.UnaryOp(desugar(stx.func, typeEnv), desugar(stx.p, typeEnv));
          }
      if (stx.p) {
        return new typ.App(desugar(stx.func, typeEnv), desugar(stx.p, typeEnv));
      }
      return new typ.App(stx.func);
    case "Function":
      return curryFunc(stx.p, stx.body);
    case "List":
      return desugarList(stx);
    case "Bool":
      return stx;
    case "String":
      return stx;
    case "Float":
      return stx;
    case "Integer":
      return stx;
    case "Let":
      return desugarLet(stx);
    default:
      return stx;
  }
}

module.exports = { desugar : desugar };
//var test = typ.ListT([1,2,3]);

//console.log(desugarList(test));


