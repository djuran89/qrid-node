const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.API_KEY);

const from = "djuran89@gmail.com";

exports.sendCode = async (to, code) => {
	try {
		const html = codeHtml(code);
		const subject = "Cofirm code";
		const msg = { to, from, subject, html };

		sendMail(msg);
	} catch (err) {
		console.error(err);
	}
};

const codeHtml = (code) => {
	return `${code}`;
};

const sendMail = (msg) => {
	if (process.env.NODE_ENV === "development") return console.log("Mail was sended.", msg);

	sendgrid
		.send(msg)
		.then((resp) => {
			console.log("Email was sented.");
		})
		.catch((error) => {
			console.error(error);
		});
};
