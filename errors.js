/*
 * This file defines common error objects
 * for reporting on syntax errors, type errors,
 * and perhaps runtime exceptions although I have
 * not thought about how that will work much
 */

function JSyntaxError(linenum, charnum, message) {
  this.linenum = linenum;
  this.charnum = charnum;
  this.errormessage = message;
  this.stxerror = function() {
    console.log("Syntax Error\n",
                "Line #", this.linenum,"\n",
                "Near character #", this.charnum, "\n",
                this.errormessage);
  };
  return this;
}

function JTypeError(linenum, charnum, token, message) {
  this.linenum = linenum;
  this.charnum = charnum;
  this.errormessage = message;
  this.token = token;
  return this;
}
/*
 * This actually makes sense because, for now
 * this will get called dynamically while the
 * source is being interpreted, but later it will
 * get called statically once it turns into a compiler
 * since the compiler will know at compile time whether
 * a variable was unbound
 */
function JUnboundError(name, env) {
  this.name = name;
  this.env_name = env.name;
  console.log("Unbound variable " + name);
  return this;
}



function JInternalError(message) {
  this.errormessage = message;
  return this;
}

module.exports =
  {JSyntaxError : JSyntaxError,
   JTypeError : JTypeError,
   JInternalError : JInternalError,
   JUnboundError : JUnboundError
  };
