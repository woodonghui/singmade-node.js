module.exports = function(str) {
	return str.trim().toLowerCase().replace(/\s+/g, '-')
};