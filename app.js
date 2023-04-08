const fs = require("fs");
const http = require("http");
const https = require("https");
const app = require("./bin/server");
const mongoose = require("mongoose");

// const httpsOptions = {
// 	key: fs.readFileSync("./certificates/localhost.key"),
// 	cert: fs.readFileSync("./certificates/localhost.crt"),
// };

// Create an HTTP service.
// http.createServer(app).listen(4000);
// Create an HTTPS service identical to the HTTP service.
// https.createServer(httpsOptions, app).listen(8080);

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
