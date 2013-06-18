var Expression = {
	display :
		function() {
			return this.exprType + " " + this.val;
		},
	type :
		function () {
			return this.exprType;
		},
	unify :
		function (t) {
			if (this.exprType === t.exprType) {
				return t.exprType;
			}
			else {
				console.log("Could not unify " + this.exprType + " with " + t.exprType);
			}
		}
};


function IntT(v) {
	this.exprType = "Integer";
	this.val = parseInt(v, 10);
	return this;
}
IntT.prototype = Expression;

function FloatT(v) {
	this.exprType = "Float";
	this.val = parseFloat(v, 10);
	return this;
}

FloatT.prototype = Expression;

function StrT(v) {
	this.exprType = "String";
	this.val = v;
	return this;
}

StrT.prototype = Expression;

function BoolT(b) {
	if (b === "true") {
		this.val = true;
	}
	else {
		this.val = false;
	}
	this.exprType = "Bool";
	return this;
}

BoolT.prototype = Expression;

function ListT(x, xs) {
	this.x = x;
	this.rest = xs;
	this.val = [x,xs];
	this.exprType = "List";
	return this;
}

ListT.prototype = Expression;

function FuncT(p, body) {
	this.p = p;
	this.body = body;
	this.val = [p, body];
	this.exprType = "Function";
	return this;
}

FuncT.prototype = Expression;

//Wrapper for function objects
function OpT(operator) {
	this.op = operator;
	this.val = this.op;
	this.exprType = "Function";
	return this;
}

OpT.prototype = Expression;

// Applications separate from other types
function App(func, p) {
	this.func = func;
	this.exprType = "Application";
	if (p)
		this.p = p;
	return this;
}

// Names are not types
function Name(identifier) {
	this.ident = identifier;
	this.val = this.ident;
	this.exprType = "Name";
	return this;
}

function Def(ident, exp) {
	this.ident = ident;
	this.val = exp;
	this.exprType = "Definition";
	return this;
}

function If(condition, thenexp, elseexp) {
	this.condition = condition;
	this.thenexp = thenexp;
	if (elseexp)
		this.elseexp = elseexp;
	this.exprType = "If";
	return this;
}

//convenience function to construct binary operators
//assumes that the identifier refers to the name of a primitive
//operation
function makeBin(ident) {
	return new OpT(new FuncT (new Name("a"), new FuncT(new Name("b"), new App(new App(ident, "a"), "b"))));
}

//Applies the function ``name'' to the list of parameters
function makeApp(name, parameters) {
	if (parameters) {
		return parameters.slice(1).reduce(function(f, ident) {
			return new App(f, ident);
		}, new App(name, parameters[0]));
	}
	else {
		return new App(name);
	}

}

OPTable = {"+" : makeBin("+")};

OPInfo = {"+" : [1, "Left"],
		  "-" : [1, "Left"],
		  "*" : [2, "Left"],
		  "/" : [2, "Left"],
		  "^" : [3, "Right"]}

module.exports =
   { IntT   : IntT,
	 FloatT : FloatT,
	 StrT   : StrT,
	 BoolT  : BoolT,
	 ListT  : ListT,
	 FuncT  : FuncT,
	 App    : App,
	 Name   : Name,
	 Def	: Def,
	 OpT 	: OpT,
	 OPInfo : OPInfo,
	 makeApp : makeApp,
	 If      : If}