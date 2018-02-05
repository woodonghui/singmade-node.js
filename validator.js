var Validator = require('validator').Validator;
var _ = require('underscore');

Validator.prototype.error = function (msg) {
	this._errors.push(msg);
	return this;
}
Validator.prototype.getErrors = function () {
	return this._errors;
}

Validator.checkAll = function(obj, rules){
	var validator = new Validator();
	_.each(rules, function(rule, field){
		validator.check(obj[field], rule.error)[rule.validator]();
	});
	return validator.getErrors();
}

module.exports = Validator;