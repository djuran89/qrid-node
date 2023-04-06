const fs = require("fs");
const sharp = require("sharp");
const PImage = require("pureimage");
const vision = require("@google-cloud/vision");

const googleKeyPath = `${__dirname}/../keys/active-landing-382903-0086bd9e844a.json`;
const googleKey = require(googleKeyPath);
const fileFaceDetection = `${__dirname}/../data/faceDetection.json`;
const fileTextDetection = `${__dirname}/../data/textDetection.json`;
const fileName = "./public/images/IMG_0240.jpeg";

exports.get = async (req, res, next) => {
	try {
		const client = new vision.ImageAnnotatorClient({
			projectId: googleKey.project_id,
			keyFilename: googleKeyPath,
		});

		// const fileName = "./public/images/German-ID-Card.jpg";
		let textDetectionResault = require(fileTextDetection);
		let faceDetecionResault = require(fileFaceDetection);
		const override = false;

		// Write data to file if no data
		if (Object.keys(textDetectionResault).length === 0 || override) {
			console.log("textDetectionResault");
			// Performs text detection
			const [textDetectionResault] = await client.textDetection(fileName);

			// Write data to file
			fs.writeFileSync(fileTextDetection, JSON.stringify(textDetectionResault));

			// const textDetection = textDetectionResault.textAnnotations;
			// textDetection.forEach((json) => retVal.push(json));
		}

		// Write data to file if no data
		if (Object.keys(faceDetecionResault).length === 0 || override) {
			console.log("faceDetecionResault");
			// Performs face detection
			const [faceDetecionResault] = await client.faceDetection(fileName);

			// Write data to file
			fs.writeFileSync(fileFaceDetection, JSON.stringify(faceDetecionResault));
		}
		const faceDetection = faceDetecionResault.faceAnnotations;
		const cropImage = await sharpImage(fileName, faceDetection[0].boundingPoly);

		const signature = await detectSignatures(fileName, textDetectionResault.fullTextAnnotation.pages[0].blocks);

		// console.log(signature);
		const retValObject = {
			textDetection: textDetectionResault.fullTextAnnotation.text,
			image: cropImage,
			// full: textDetectionResault,
			signature,
			faceDetecionResault,
		};

		res.status(200).json(retValObject);
	} catch (err) {
		next(err);
	}
};

const detectSignatures = async (fileName, blocks) => {
	try {
		const lenght = blocks.length;
		const lookupBlock = blocks[lenght - 1];
		const base64 = await sharpImage(fileName, lookupBlock.boundingBox, null, 30, 30);

		console.log(base64.length);
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
		// const metadata = await pipeline.metadata();

		pipeline.extract({
			left: left,
			top: top,
			width: width,
			height: height,
		});
		resize && pipeline.resize(resize);
		const bufferDate = await pipeline.toBuffer();
		const base64Date = `data:image/jpeg;base64,` + bufferDate.toString("base64");

		return base64Date;
	} catch (err) {
		console.log(err);
	}
};

async function highlightImage(inputFile, blocks, outputFile = "out.png") {
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
