const jwt = require("jsonwebtoken");

const tokenExpiration = 1111180; // seconds
const secretKey = process.env.JWT_SECRET_KEY;
exports.getToken = async (req, res, next) => {
	try {
		const userId = req.session.user?._id;
		if (!userId) return res.status(400).json(sendMessage(`Please login.`));

		const token = jwt.sign({ userId }, secretKey, { expiresIn: tokenExpiration });
		res.status(200).json(token);
	} catch (err) {
		next(err);
	}
};

function sendMessage(msg) {
	return { msg };
}
