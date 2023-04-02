const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongooseSchema = new Schema(
	{
		to: { type: String, required: true, index: true },
		user: { type: Object },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Form", mongooseSchema);
