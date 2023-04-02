const ProfileModel = require("../models/profile");
const FormModel = require("../models/form");
const sendEmail = require("../middleware/sendEmail");
const io = require("../bin/socket");

const bcrypt = require("bcrypt");
const saltRounds = 16;
const successMsg = sendMessage("success");

exports.login = async (req, res, next) => {
	try {
		const inValidMsg = `Wrong email or password.`;
		const email = req.body.email.toLowerCase();
		const password = req.body.password;

		const findProfile = await ProfileModel.findOne({ email: { $regex: new RegExp(email, "i") } });
		if (!findProfile) return res.status(404).json(sendMessage(inValidMsg));

		const isValidate = await bcrypt.compare(password, findProfile.password);
		if (!isValidate) return res.status(404).json(sendMessage(inValidMsg));

		const retValProfile = {
			_id: findProfile._id,
			email: findProfile.email,
		};
		req.session.user = retValProfile;
		res.status(200).json(retValProfile);
	} catch (err) {
		next(err);
	}
};

exports.isLogin = async (req, res, next) => {
	try {
		const _id = req.session.user?._id;
		const email = req.session.user?.email;
		if (!_id) return res.status(200).json(null);
		if (!email) return res.status(200).json(null);

		res.status(200).json({ _id, email });
	} catch (err) {
		next(err);
	}
};

exports.logout = async (req, res, next) => {
	try {
		req.session.destroy();
		res.status(200).json(sendMessage(`Successfully logged out.`));
	} catch (err) {
		next(err);
	}
};

exports.create = async (req, res, next) => {
	try {
		const email = req.session.confirm.email.toLowerCase();
		const password = req.body.password;

		if (!email) return res.status(400).json(sendMessage("Plase enter email."));

		const findProfile = await ProfileModel.find({ email: { $regex: new RegExp(email, "i") } });
		if (findProfile.length > 0) return res.status(400).json(sendMessage("Email already exist."));

		const hashPassword = await bcrypt.hash(password, saltRounds);
		const createProfile = await ProfileModel.create({
			email,
			password: hashPassword,
		});

		const retValProfile = {
			_id: createProfile._id,
			email: createProfile.email,
		};

		req.session.user = retValProfile;
		res.status(200).json(retValProfile);
	} catch (err) {
		next(err);
	}
};

exports.send = async (req, res, next) => {
	try {
		const { to, from, user } = req.body;

		if (to === from) return res.status(400).json(sendMessage(`You can't sent information to your self.`));

		if (user) {
			const findUser = await ProfileModel.findById(to);
			if (findUser === null) return res.status(400).json(sendMessage(`Profile you are look for is not found.`));

			const createForm = new FormModel({ to, user });
			const saveForm = await createForm.save();

			io.getIO().emit(to, saveForm);

			return res.status(200).json(sendMessage(`Your infomation was send to: ${findUser.email}`));
		}

		if (to && from) {
			const sessionUserId = req.session.user?._id;
			if (sessionUserId != from || !sessionUserId) return res.status(400).json(sendMessage(`Please login.`));

			const findFromUser = await ProfileModel.findById(sessionUserId);
			if (!findFromUser) return res.status(400).json(sendMessage(`Please login.`));

			const findUserTo = await ProfileModel.findById(to);
			if (!findUserTo) return res.status(400).json(sendMessage(`User not found.`));

			const createForm = new FormModel({ to, user: findFromUser });
			const saveForm = await createForm.save();

			io.getIO().emit(to, saveForm);

			return res.status(200).json(sendMessage(`Your information was send to: ${findUserTo.email}`));
		}

		res.status(400).json(sendMessage(`Something was wrong.`));
	} catch (err) {
		next(err);
	}
};

exports.notification = async (req, res, next) => {
	try {
		const userId = req.session.user?._id;
		const findForm = await FormModel.find({ to: userId }).sort({ createdAt: -1 }).limit(5);

		res.status(200).json(findForm);
	} catch (err) {
		next(err);
	}
};

exports.notifictionRead = async (req, res, next) => {
	try {
		const activeNotifictions = req.body.activeNotifictions;
		const activeNotifictionsIds = activeNotifictions.map((el) => el._id);

		await FormModel.updateMany({ _id: activeNotifictionsIds }, { active: false });

		res.status(200).json(successMsg);
	} catch (err) {
		next(err);
	}
};

exports.sendConfirmCode = async (req, res, next) => {
	try {
		const email = req.body.email;
		const code = generateRandomString(6);

		if (!email) return res.status(400).json(sendMessage("Plase enter email."));

		const findProfile = await ProfileModel.find({ email: { $regex: new RegExp(email, "i") } });
		if (findProfile.length > 0) return res.status(400).json(sendMessage("Email already exist."));

		req.session.confirm = { email, code };
		sendEmail.sendCode(email, code);
		res.status(200).json(successMsg);
	} catch (err) {
		next(err);
	}
};

exports.cofirmCode = async (req, res, next) => {
	try {
		const { email, code } = req.body;
		const { email: sessionEmail, code: sessionCode } = req.session.confirm;
		console.log(sessionCode);

		if (email !== sessionEmail) return res.status(400).json(sendMessage("Email was wrong."));
		if (code !== sessionCode) return res.status(400).json(sendMessage("Code was wrong."));

		res.status(200).json(successMsg);
	} catch (err) {
		next(err);
	}
};

function sendMessage(msg) {
	return { msg };
}

function generateRandomString(length) {
	let result = "";
	const characters = "0123456789";
	// const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}