const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongooseSchema = new Schema(
	{
		token: { type: String, index: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("DeletedToken", mongooseSchema);
