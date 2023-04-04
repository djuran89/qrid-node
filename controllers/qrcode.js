const jwt = require("jsonwebtoken");
const DeletedToken = require("../models/deletedToken");

const tokenExpiration = 180; // seconds
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

exports.checkToken = async (req, res, next) => {
	try {
		const token = req.body.token;

		const findToken = await DeletedToken.findOne({ token });
		if (findToken) return res.status(200).json(false);

		jwt.verify(token, secretKey, async (err, data) => {
			if (err) return res.status(200).json(false);
			return res.status(200).json(true);
		});
	} catch (err) {
		next(err);
	}
};

exports.deleteToken = async (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];

		const deletedToken = new DeletedToken({ token });
		await deletedToken.save();

		res.status(200).json(sendMessage(`Success.`));
	} catch (err) {
		next(err);
	}
};

function sendMessage(msg) {
	return { msg };
}
