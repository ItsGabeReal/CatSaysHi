const { exec } = require('child_process')
const fs = require('fs')
const pixels = require('image-pixels')

// Should be a 53px wide and 7px tall image. Each pixel's value is determined by its red channel
const IMAGE_PATH = 'cat.png'
const YEAR = 2020
const BRIGHTNESS_STEPS = 7
const DATE_START_OFFSET = 3

let pixelData
let imageWidth

async function paint() {
	// Load image
	console.log("loading image...")
	var {data, width, height} = await pixels(IMAGE_PATH)
	pixelData = data
	imageWidth = width
	console.log("image loaded")

	const ONE_DAY_IN_MILLISECONDS = 86400000
	let pixelIndex = DATE_START_OFFSET
	let numCommits = 0
	for (let date = new Date(YEAR, 0, 1); date.getFullYear() == YEAR; date = new Date(date.valueOf() + ONE_DAY_IN_MILLISECONDS)) {
		// Convert pixel brightness into number of steps
		let x = Math.floor(pixelIndex / 7)
		let y = pixelIndex % 7
		let brightness = getPixelBrightness(x, y) / 255.0
		let steps = Math.floor(brightness * BRIGHTNESS_STEPS)

		// Execute commits
		console.log(`creating pixel #${pixelIndex - DATE_START_OFFSET}: date: ${date.toDateString()}, x: ${x}, y: ${y}, steps: ${steps}`)
		for (let i = 0; i < steps; i++) {
			await addCommit(date, `txt #${numCommits + 1}\n`)
			numCommits++
		}

		pixelIndex++
	}
}

function getPixelBrightness(x, y) {
	let pixelIndex = x + y * imageWidth

	// Return the red pixel. R G and B should be the same
	return pixelData[pixelIndex * 4]
}

async function addCommit(date, fileText) {
	return new Promise((resolve) => {
		// Modify text document
		fs.appendFile('txt.txt', fileText, (err) => {
			if (err) throw err;

			// Commit
			let commitCommand = `git commit -a --date="${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}" -m "${fileText}"`
			command(commitCommand).then(() => {
				resolve()
			})
		})
	})
}

function command(string) {
	return new Promise((resolve) => {
		const command = exec(string, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
			}
		})
		command.on('close', (code, signal) => {
			resolve()
		})
	})
}


paint()