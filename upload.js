var cloudinary = require('./cloudinary');


console.log('hello');

cloudinary.cloudinary.uploader.upload("http://www.singmade.com/css/svg/top-lady.svg",
	function(result) { 
  console.log(result) 
}, {resource_type: 'raw'});




/*

{ public_id: 'frnk2tpgikf3jh8phaki.svg',
  version: 1381850813,
  signature: 'a4431c38cc1acd59ab2dff10c6850e7c92f99539',
  resource_type: 'raw',
  created_at: '2013-10-15T15:26:53Z',
  bytes: 1806,
  type: 'upload',
  url: 'http://res.cloudinary.com/boutiquesg/raw/upload/v1381850813/frnk2tpgikf3jh8phaki.svg',
  secure_url: 'https://res.cloudinary.com/boutiquesg/raw/upload/v1381850813/frnk2tpgikf3jh8phaki.svg' }
*/