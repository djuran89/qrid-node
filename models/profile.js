const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongooseSchema = new Schema(
	{
		email: { type: String, required: true, unique: true, index: true },
		password: { type: String, required: true },
		firstName: { type: String },
		lastName: { type: String },
		idNumber: { type: String },
		phone: { type: String },
		address: { type: String },
		city: { type: String },
		state: { type: String },
		zip: { type: String },
		country: { type: String },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Profile", mongooseSchema);
