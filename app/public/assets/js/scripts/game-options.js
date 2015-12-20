module.exports = {
	name: {
		val: Logophile.RandomName,
		type: "string",
		valid: true
	},
	boardSize: {
		val: 5,
		type: "number",
		min: 4,
		max: 10,
		valid: true
	},
	frequencies: {
		val: "UNIQUES",
		type: "string",
		valid: true
	},
	timeLimitMinutes: {
		val: 2,
		type: "number",
		min: 1,
		max: 60,
		valid: true
	},
	timeLimitSeconds: {
		val: 0,
		type: "number",
		canBeFalsy: true,
		valid: true
	},
	pauseTime: {
		val: 40,
		type: "number",
		min: 10,
		valid: true
	},
	"private": {
		val: false,
		type: "boolean",
		canBeFalsy: true,
		valid: true
	},
	ranked: {
		val: false,
		type: "boolean",
		canBeFalsy: true,
		valid: true
	},
	scoreStyle: {
		val: "NORMAL",
		type: "string",
		valid: true
	},
	minLettersToScore: {
		val: 4,
		type: "number",
		min: 3,
		max: 7,
		valid: true
	},
	boardHighFrequency: {
		val: false,
		type: "boolean",
		canBeFalsy: true,
		valid: true
	},
	boardMinWords: {
		val: 100,
		type: "number",
		canBeFalsy: true,
		valid: true
	},
	boardRequireLength: {
		val: 10,
		type: "number",
		canBeFalsy: true,
		min: 0,
		max: 13,
		valid: true
	}
}
