let socket;
const socketOption = {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
	// requestCert: false,
	// rejectUnauthorized: false,
	// secure: true,
};

module.exports = {
	init: (httpServer) => {
		const socketio = require("socket.io");
		socket = socketio(httpServer, socketOption);
		return socket;
	},
	getIO: () => {
		if (!socket) {
			throw new Error("Socket.io not initialized!");
		}
		return socket;
	},
	close: () => {
		try {
			socket.disconnect();
			console.log("Disconected!");
		} catch (err) {
			console.error(err);
		}
	},
};
