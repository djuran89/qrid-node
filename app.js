const http = require("http");
const app = require("./bin/server");
const mongoose = require("mongoose");

const server = http.createServer(app);

server.listen(process.env.PORT || "4001", () => console.log(`Server is running on port ${process.env.PORT || "4001"}`));
server.on("error", onError);

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

const io = require("./bin/socket").init(server);
io.on("connection", (socket) => {
	socket.on("disconnect", () => socket.disconnect());
});

function onError(error) {
	console.log(error);
}
