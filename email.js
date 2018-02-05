var nodemailer = require("nodemailer");

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "woo.donghui@gmail.com",
        pass: "ilovesingsing!@#"
    }
});

exports.send = function(to, subject, html) {

	var mailOptions = {
	    from: "Accounts <donghui@singmade.com>", // sender address
	    to: to, // list of receivers
	    subject: subject, // Subject line
	    text: "Oops, it seems that your emailjsil client doesn't support html format.", // plaintext body
	    html: html // html body
	}

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if(error){
	        console.log(error);
	    }else{
	        console.log("Message sent: " + response.message);
	    }
	    // if you don't want to use this transport object anymore, uncomment following line
	    smtpTransport.close(); // shut down the connection pool, no more messages
	});	
};
