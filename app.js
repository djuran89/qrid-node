const http = require("http");
const app = require("./bin/server");
const mongoose = require("mongoose");
const env = require("dotenv").config();

const server = http.createServer(app);

server.listen(process.env.PORT || "4001", () => console.log(`Server is running on port ${process.env.PORT || "4001"}`));
server.on("error", onError);

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

function onError(error) {
	console.log(error);
}
