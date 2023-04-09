exports.isLogin = (req, res, next) => {
	const userId = req.session.user?._id;
	if (!userId) return res.status(401).send("Unauthorized");

	req.body.userId = userId;
	next();
};
