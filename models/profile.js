const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongooseSchema = new Schema(
	{
		email: { type: String, required: true, unique: true, index: true },
		password: { type: String, required: true },
		firstname: { type: String },
		lastname: { type: String },
		idnumber: { type: String },
		phone: { type: String },
		address: { type: String },
		city: { type: String },
		state: { type: String },
		zipcode: { type: String },
		country: { type: String },
		dateOfBirth: { type: String },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Profile", mongooseSchema);
