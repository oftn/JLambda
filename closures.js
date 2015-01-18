/* Takes an AST and converts all of the functions into "closures"
 * A closure is a triple of:
 *  the bound variables in a function or let
 *  the free variables in a function or let
 *  a function body or let body and bound values (if it is an escaping closure only)
 * The closure has the property that all of the free variables of the function or let
 * are in the environment, or an exception is raised because the variable is not bound
 * in the current environment.
 * A free variable is simply those that are not in the list of formal parameters or bound variables if it is a let
 *
 * Therefore in order to call a closure one must first extract the actual function and then
 * call the function with the environment associated with it.
 * For the purposes of type checking it does not matter how the function gets called, the environment
 * is only used for looking up the types of names. Formal parameters are given type variables.
 *
 * The first phase of closure conversion is not really closure conversion exactly.
 * All it does is find out the free variables in scope and tie those up into a data structure with their types later.
 * The second phase will be done to the CPS language and closures will actually lambda-lifted out potentially.
 */

var rep = require("./representation.js");
var errors = require("./errors.js");
var parser = require("./parse.js");
var $ = require("./tools.js");
var _ = require("underscore");

var notEmpty = _.compose($.not, _.partial(_.equal, []));

function fvs(stx) {
  switch (stx.exprType) {
    case "Integer":
      return [];
    case "Float":
      return [];
    case "String":
      return [];
    case "Function":
      return [];
    case "Nil":
      return [];
    case "Bool":
      return [];
    case "Let":
      return [];
    case "Unary":
      return _.flatten([stx.op.ident, fvs(stx.val)]);
    case "Definition":
      return _.flatten(fvs(stx.val));
    case "Application":
      var vs = _.flatten(fvs(stx.p));
      var f_fvs = _.flatten(fvs(stx.func));
      return _.flatten([vs, f_fvs]);
    case "If":
      if (stx.elseexp) {
        var cond_fvs = fvs(stx.condition);
        var then_fvs = fvs(stx.thenexp);
        var else_fvs = fvs(stx.elseexp);
        return _.flatten([cond_fvs, then_fvs, else_fvs]);
      }
      else {
        return _.flatten([fvs(stx.condition), fvs(stx.thenexp)]);
      }
      break;
    case "Name":
      return [stx.ident];
  }
}

function annotate_fvs(stx) {
  /* Takes a stx object that is either
   * a lambda
   * a let
   * and returns a closure wrapped around that stx object
   */
  if (stx.exprType !== "Function") {
    throw errors.JInternalError(
           ["Tried to calculate the free variables of",
           "something that was not a function.\n",
           "That something was a: " + stx.exprType +"\n"].reduce(
                function (a,b) {
                  return a+" "+b;
                }, ""));
  }
  var variables, free_variables, bound_vars, stx_type;

  bound_vars = [stx.p.ident,];
  variables = fvs(stx.body);
  free_variables = _.difference(_.uniq(variables), bound_vars);
  return new rep.Closure(bound_vars, free_variables, stx, []);
}

/*
 * This traverse the tree and gathers up all of the free variables of various functions/let bindings
 */
function annotate_fvs_all(stx) {
  var closure;
  switch (stx.exprType) {
    case "Let":
      stx.pairs = stx.pairs.map(annotate_fvs_all);
      stx.body = annotate_fvs_all(stx.body);
      return stx;
    case "Function":
      closure = annotate_fvs(stx);
      if (closure.free_vars.length !== 0) {
        /* This checks if there are any free variables
         * If there are no free variables in the body of the function
         * then it is not a closure
         */
        closure.body.body = annotate_fvs_all(closure.body.body);
        return closure;
      }
      stx.body = annotate_fvs_all(stx.body);
      return stx;
    case "Unary":
      stx.val = annotate_fvs_all(stx.val);
      return stx;
    case "Application":
      stx.func = annotate_fvs_all(stx.func);
      stx.p = annotate_fvs_all(stx.p);
      return stx;
    case "If":
      if (stx.elseexp) {
        stx.condition = annotate_fvs_all(stx.condition);
        stx.thenexp = annotate_fvs_all(stx.thenexp);
        stx.elseexp = annotate_fvs_all(stx.elseexp);
        return stx;
      }
      else {
        stx.condition = annotate_fvs_all(stx.condition);
        stx.thenexp = annotate_fvs_all(stx.thenexp);
        return stx;
      }
      break;
    case "Definition":
      stx.val = annotate_fvs_all(stx.val);
      return stx;
    default:
      return stx;
  }
}


function test(src) {
  var ast = parser.parse(src);
}

//console.log(test("if something then if a then if b then c else d else rtrrt else some_other_thing"));
module.exports = {
  annotate_fvs : annotate_fvs_all
};
