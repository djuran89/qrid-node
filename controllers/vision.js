const fs = require("fs");
const { dirname } = require("path");
const sharp = require("sharp");
const moment = require("moment");
const PImage = require("pureimage");
const vision = require("@google-cloud/vision");

const appPath = dirname(__dirname);

// const googleKeyPath = process.env.VISION_API_KEY_PATH;
// const googleKey = require(`${appPath}/${googleKeyPath}`);
// const fileFaceDetection = `${appPath}/data/faceDetection.json`;
// const fileTextDetection = `${appPath}/data/textDetection.json`;
// const client = new vision.ImageAnnotatorClient({
// 	projectId: googleKey.project_id,
// 	keyFilename: googleKeyPath,
// });

// exports.get = async (req, res, next) => {
// 	try {
// 		const imageBase64 = req.body.image;

// 		const fileName = "test.png";
// 		saveBase64Image(imageBase64, fileName);

// 		const [textDetectionResault] = await client.textDetection(fileName);
// 		const [faceDetecionResault] = await client.faceDetection(fileName);

// 		const faceDetection = faceDetecionResault.faceAnnotations;
// 		const cropImage = await sharpImage(fileName, faceDetection[0].boundingPoly);
// 		const signature = await detectSignatures(fileName, textDetectionResault.fullTextAnnotation.pages[0].blocks);

// 		const retValObject = {
// 			textDetection: textDetectionResault.fullTextAnnotation.text,
// 			image: cropImage,
// 			signature,
// 			faceDetecionResault,
// 		};

// 		res.status(200).json(retValObject);
// 	} catch (err) {
// 		next(err);
// 	}
// };

exports.get = async (req, res, next) => {
	try {
		let textDetectionResault = require(fileTextDetection);
		let faceDetecionResault = require(fileFaceDetection);
		const saveToFile = true;
		const doAnalysis = true;

		const imageBase64 = req.body.image;
		const saveFileName = "test.png";
		await saveBase64Image(imageBase64, saveFileName);
		const fileName = `./private/unidentified-detections/${saveFileName}`;

		if (doAnalysis) {
			[textDetectionResault] = await client.textDetection(fileName);
		}
		if (doAnalysis) {
			[faceDetecionResault] = await client.faceDetection(fileName);
		}
		saveToFile && fs.writeFileSync(fileTextDetection, JSON.stringify(textDetectionResault));
		saveToFile && fs.writeFileSync(fileFaceDetection, JSON.stringify(faceDetecionResault));

		const fullTextDetection = textDetectionResault.fullTextAnnotation;
		const textDetectionBlocks = fullTextDetection.pages[0].blocks;
		const nationality = getNationality(fullTextDetection);
		const isIdentityCard = fullTextDetection.text.toLowerCase().includes("identity card");

		const faces = faceDetecionResault.faceAnnotations;
		const cropFaceImage = faces.length > 0 && (await sharpImage(fileName, faces[0].boundingPoly));
		const signature = await detectSignatures(fileName, textDetectionBlocks, nationality);
		const user = getProfileInformation(fullTextDetection, nationality);

		const retValObject = {
			user: { ...user, profile: cropFaceImage, signature },
			nationality,
			isIdentityCard,
			fullTextDetection,
		};

		if (nationality === "Unknown") saveImageData(fileName);
		else if (user.errors && user.errors.length > 0) saveImageData(fileName);
		else if (!isIdentityCard) saveImageData(fileName);

		console.log(retValObject.user);
		res.status(200).json(retValObject);
	} catch (err) {
		next(err);
	}
};
const fileName = "./private/images/German-ID-Card.jpg";
exports.getFromFile = async (req, res, next) => {
	try {
		let textDetectionResault = require(fileTextDetection);
		let faceDetecionResault = require(fileFaceDetection);
		const override = false;

		// Write data to file if no data
		if (Object.keys(textDetectionResault).length === 0 || override) {
			const [textDetectionResault] = await client.textDetection(fileName);
			fs.writeFileSync(fileTextDetection, JSON.stringify(textDetectionResault));
		}

		// Write data to file if no data
		if (Object.keys(faceDetecionResault).length === 0 || override) {
			const [faceDetecionResault] = await client.faceDetection(fileName);
			fs.writeFileSync(fileFaceDetection, JSON.stringify(faceDetecionResault));
		}

		const fullTextDetection = textDetectionResault.fullTextAnnotation;
		const textDetectionBlocks = fullTextDetection.pages[0].blocks;
		const nationality = getNationality(fullTextDetection);
		const isIdentityCard = fullTextDetection.text.toLowerCase().includes("identity card");

		const faces = faceDetecionResault.faceAnnotations;
		const cropFaceImage = faces.length > 0 && (await sharpImage(fileName, faces[0].boundingPoly));
		const signature = await detectSignatures(fileName, textDetectionBlocks, nationality);
		const user = getProfileInformation(fullTextDetection, nationality);

		const retValObject = {
			user: { ...user, profile: cropFaceImage, signature },
			nationality,
			isIdentityCard,
		};

		if (nationality === "Unknown") saveImageData(fileName);
		else if (user.errors && user.errors.length > 0) saveImageData(fileName);
		else if (!isIdentityCard) saveImageData(fileName);

		res.status(200).json(retValObject);
	} catch (err) {
		next(err);
	}
};

const mapDetection = {
	signature: {
		Germany: -1,
		Serbia: -1,
		Unknown: null,
	},
	idnumber: {
		Germany: -2,
	},
	birthday: {
		Germany: 3,
	},
};

const getProfileInformation = (data, nationality) => {
	const text = data.text;
	const retVal = {};
	const lines = text.split("\n");

	for (const index in lines) {
		const i = parseInt(index);
		const line = lines[i].toLowerCase();
		const nextLine = lines[i + 1];

		if (line.includes("given name")) retVal.firstname = nextLine;
		if (line.includes("surname")) retVal.lastname = nextLine;
		if (line.includes("date of birth")) retVal.dateOfBirth = findBirthday(lines, i, nationality);
	}
	retVal.idnumber = findIdNumber(data, nationality);

	return lookupErrors(lines, retVal);
};

const findBirthday = (lines, i, nationality) => {
	const addLine = mapDetection.birthday[nationality] || 1;
	let lookUpBirthday = lines[i + addLine];

	if (nationality === "Germany") lookUpBirthday = findDateInLine(lookUpBirthday);

	lookUpBirthday = formatDate(lookUpBirthday);

	return moment(lookUpBirthday).format("YYYY-MM-DD");
};

const formatDate = (date) => {
	const dateRegex = /(\d{2})\.(\d{2})\.(\d{4})/;
	const dateMatch = date.match(dateRegex);
	if (dateMatch) {
		const day = dateMatch[1];
		const month = dateMatch[2];
		const year = dateMatch[3];
		return `${year}-${month}-${day}`;
	}
	return date;
};

const findIdNumber = (data, nationality) => {
	try {
		const text = data.text;
		const blocks = data.pages[0].blocks;
		const lines = text.split("\n");

		for (const index in lines) {
			const i = parseInt(index);
			const line = lines[i].toLowerCase();
			const nextLine = lines[i + 1];

			if (line.includes("reg no")) return nextLine;
		}

		if (nationality === "Germany") {
			const lookUpLine = mapDetection.idnumber[nationality];
			if (lookUpLine) {
				const idnumber = blocks[blocks.length + lookUpLine].paragraphs[0].words[0].symbols.map((s) => s.text).join("");
				return idnumber;
			}
		}
	} catch (err) {
		console.log(err);
	}
};

const findDateInLine = (line) => {
	const date = line.match(/\d{2}\.\d{2}\.\d{4}/g);
	if (date) return date[0];
};

const lookupErrors = (lines, retVal) => {
	const errors = [];
	if (!retVal.firstname) errors.push("Fisrtname not found");
	if (!retVal.lastname) errors.push("Lastname not found");
	if (!retVal.dateOfBirth) errors.push("Date of birth not found");
	if (!retVal.idnumber) errors.push("ID number not found");
	if (lines.find((line) => line.toLowerCase()).includes("identity card")) errors.push("This is not an identity card");

	return { ...retVal, errors };
};

const getNationality = ({ text }) => {
	const lookUp = text.toLowerCase();
	if (lookUp.includes("deutschland")) return "Germany";
	if (lookUp.includes("serbia")) return "Serbia";

	return "Unknown";
};

const detectSignatures = async (fileName, blocks, nationality) => {
	try {
		const indexBack = mapDetection.signature[nationality];
		if (indexBack === null || !indexBack) return null;

		const lenght = blocks.length;
		const lookupBlock = blocks[lenght + indexBack];
		const base64 = await sharpImage(fileName, lookupBlock.boundingBox);

		// console.log(base64.length);
		// highlightImage(fileName, lookupBlock);
		return base64;
	} catch (err) {
		console.log(err);
	}
};

const sharpImage = async (src, boundingBox, resize, paddingX = 0, paddingY = 0) => {
	try {
		const top = boundingBox.vertices[0].y - paddingX;
		const left = boundingBox.vertices[0].x - paddingY;
		const bottom = boundingBox.vertices[2].y + paddingX;
		const right = boundingBox.vertices[2].x + paddingY;

		const width = right - left;
		const height = bottom - top < 0 ? top - bottom : bottom - top;

		const inputImage = fs.readFileSync(src);
		const pipeline = sharp(inputImage).rotate(0).jpeg();
		const metadata = await pipeline.metadata();

		pipeline.extract({
			left: left,
			top: top,
			width: width,
			height: height,
		});

		resize && pipeline.resize(resize);
		const bufferDate = await pipeline.toBuffer();
		const base64Date = `data:image/${metadata.format};base64,` + bufferDate.toString("base64");

		return base64Date;
	} catch (err) {
		console.log(err);
	}
};

const saveImageData = async (data) => {
	try {
		let base64 = data;
		if (!data.match(/^data:image\/\w+;base64,/)) {
			const readFileSync = fs.readFileSync(data);
			base64 = Buffer.from(readFileSync).toString("base64");
		}

		const metadata = await sharp(data).metadata();
		const fileName = new Date().getTime() + "." + metadata.format;

		return saveBase64Image(base64, fileName);
	} catch (err) {
		console.log(err);
	}
};

const saveBase64Image = async (base64, fileName, path) => {
	try {
		const dir = !path && appPath + "/private/unidentified-detections/";
		if (!fs.existsSync(dir)) fs.mkdirSync(dir);

		const data = base64.replace(/^data:image\/\w+;base64,/, "");
		const bufferData = Buffer.from(data, "base64");

		fs.writeFileSync(dir + fileName, bufferData);

		return fileName;
	} catch (err) {
		console.log(err);
	}
};

async function highlightImage(inputFile, blocks, outputFile = "highlightImage.png") {
	const PImage = require("pureimage");
	const stream = fs.createReadStream(inputFile);
	let promise;
	if (inputFile.match(/\.jpg$/)) {
		promise = PImage.decodeJPEGFromStream(stream);
	} else if (inputFile.match(/\.jpeg$/)) {
		promise = PImage.decodeJPEGFromStream(stream);
	} else if (inputFile.match(/\.png$/)) {
		promise = PImage.decodePNGFromStream(stream);
	} else {
		throw new Error(`Unknown filename extension ${inputFile}`);
	}
	const img = await promise;
	const context = img.getContext("2d");
	context.drawImage(img, 0, 0, img.width, img.height, 0, 0);

	// Now draw boxes around all the faces
	context.strokeStyle = "rgba(0,255,0,0.8)";
	context.lineWidth = "5";

	blocks = blocks.length ? blocks : [blocks];
	blocks.forEach((block) => drowStroke(context, block));

	// Write the result to a file
	console.log(`Writing to file ${outputFile}`);
	const writeStream = fs.createWriteStream(outputFile);
	await PImage.encodePNGToStream(img, writeStream);
}

const drowStroke = (context, block) => {
	context.beginPath();
	let origX = 0;
	let origY = 0;
	block.boundingBox.vertices.forEach((bounds, i) => {
		if (i === 0) {
			origX = bounds.x;
			origY = bounds.y;
			context.moveTo(bounds.x, bounds.y);
		} else {
			context.lineTo(bounds.x, bounds.y);
		}
	});
	context.lineTo(origX, origY);
	context.stroke();

	return context;
};

const imageBufferFromBase64 = (base64) => {
	const data = base64.replace(/^data:image\/\w+;base64,/, "");
	const bufferData = Buffer.from(data, "base64");

	return bufferData;
};
