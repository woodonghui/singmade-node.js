var _ = require('underscore');

_.mixin({
	
  compactObject : function(o) {
  	_.each(o, function(v, k){
  		if(_.isNull(v) || _.isUndefined(v)) delete o[k];
  	});
  	return o;
  },

  queryObject : function(o) {
  	var obj = this.compactObject(o);
  	var arr = _.map(obj, function(v, k) {
  		return k + "=" + v;
  	});
  	return arr.join("&");
  }


});

module.exports = _;