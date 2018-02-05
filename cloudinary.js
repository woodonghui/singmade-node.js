var cloudinary = require('cloudinary');	

cloudinary.config({ 
	cloud_name: 'boutiquesg', 
	api_key: '981248284822466', 
	api_secret: 'g3c0E0y9TlhylPZUAqJ5TJSRH8g' 
});

exports.url = function(public_id, format, option){
	return cloudinary.url(public_id + "." + format, option);
};

exports.cloudinary = cloudinary;