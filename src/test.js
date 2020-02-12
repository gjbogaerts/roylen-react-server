const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
	to: 'gj@raker.nl',
	from: 'gj@roylen.ga',
	subject: 'sending mail with sendgrid',
	text: 'This is easy, even with node.js',
	html: '<strong> and can even include html tags</strong>'
};

sgMail.send(msg);
