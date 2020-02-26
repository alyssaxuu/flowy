# Flowy

![Demo](https://media.giphy.com/media/dv1C56OywrP7Cn20nr/giphy.gif)
<br>A javascript library to create pretty flowcharts with ease ✨

[Dribbble](https://dribbble.com/shots/8576286-Flowy-Flowchart-Engine) | [Twitter](https://twitter.com/alyssaxuu/status/1199724989353730048) | [Live demo](https://alyssax.com/x/flowy)

Flowy makes creating WebApps with flowchart functionality an incredibly simple task. Build automation software, mind mapping tools, or simple programming platforms in minutes by implementing the library into your project.

Made by [Alyssa X](https://alyssax.com)

## Table of contents

- [Installation](#installation)
- [Features](#features)
- [Installation](#installation)
- [Running Flowy](#running-flowy)
  - [Initialization](#initialization)
  - [Example](#example)
- [Callbacks](#callbacks) - [On grab](#on-grab) - [On release](#on-release) - [On snap](#on-snap)
- [Methods](#methods)
  - [Get the flowchart data](#get-the-flowchart-data)
  - [Import the flowchart data](#import-the-flowchart-data)
  - [Delete all blocks](#delete-all-blocks)

## Installation

```bash
npm install flowy
```

### Publish

This package is published by first converting to ES5 modules in a `dist` folder. The `package.json` is copied to the `dist` folder and published from there to allow importing modules from `flowy/file` instead of `flowy/dist/file`.

```bash
npm run dist && npm publish dist
```

## Features

Currently, Flowy supports the following:

- [x] Responsive drag and drop
- [x] Automatic snapping
- [x] Block rearrangement
- [x] Delete blocks
- [x] Automatic block centering
- [x] Conditional snapping
- [x] Import saved files
- [x] Mobile support
- [x] Vanilla javascript (no dependencies)
- [ ] [npm install](https://github.com/alyssaxuu/flowy/issues/10)

You can suggest new features [here](https://github.com/alyssaxuu/flowy/issues)

## Installation

Adding Flowy to your WebApp is incredibly simple:

1. Link `flowy.min.js` and `flowy.min.css` to your project
2. Create a canvas element that will contain the flowchart (for example, `<div id="canvas"></div>`)
3. Create the draggable blocks with the `.create-flowy` class (for example, `<div class="create-flowy">Grab me</div>`)

## Running Flowy

### Initialization

```javascript
flowy(canvas, ongrab, onrelease, onsnap, spacing_x, spacing_y)
```

| Parameter   | Type                     | Description                                                      |
| ----------- | ------------------------ | ---------------------------------------------------------------- |
| `canvas`    | _javascript DOM element_ | The element that will contain the blocks                         |
| `ongrab`    | _function_ (optional)    | Function that gets triggered when a block is dragged             |
| `onrelease` | _function_ (optional)    | Function that gets triggered when a block is released            |
| `onsnap`    | _function_ (optional)    | Function that gets triggered when a block snaps with another one |
| `spacing_x` | _integer_ (optional)     | Horizontal spacing between blocks (default 20px)                 |
| `spacing_y` | _integer_ (optional)     | Vertical spacing between blocks (default 80px)                   |

To define the blocks that can be dragged, you need to add the class `.create-flowy`

### Example

**HTML**

```html
<div class="create-flowy">The block to be dragged</div>
<div id="canvas"></div>
```

**Javascript**

```javascript
var spacing_x = 40
var spacing_y = 100
// Initialize Flowy
flowy(
  document.getElementById('canvas'),
  onGrab,
  onRelease,
  onSnap,
  spacing_x,
  spacing_y
)
function onGrab(block) {
  // When the user grabs a block
}
function onRelease() {
  // When the user releases a block
}
function onSnap(block, first, parent) {
  // When a block snaps with another one
}
```

## Callbacks

In order to use callbacks, you need to add the functions when initializing Flowy, as explained before.

### On grab

```javascript
function onGrab(block) {
  // When the user grabs a block
}
```

Gets triggered when a user grabs a block with the class `create-flowy`

| Parameter | Type                     | Description                     |
| --------- | ------------------------ | ------------------------------- |
| `block`   | _javascript DOM element_ | The block that has been grabbed |

### On release

```javascript
function onRelease() {
  // When the user lets go of a block
}
```

Gets triggered when a user lets go of a block, regardless of whether it attaches or even gets released in the canvas.

### On snap

```javascript
function onSnap(block, first, parent) {
  // When a block can attach to a parent
  return true
}
```

Gets triggered when a block can attach to another parent block. You can either prevent the attachment, or allow it by using `return true;`

| Parameter | Type                     | Description                                                             |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `block`   | _javascript DOM element_ | The block that has been grabbed                                         |
| `first`   | _boolean_                | If true, the block that has been dragged is the first one in the canvas |
| `parent`  | _javascript DOM element_ | The parent the block can attach to                                      |

## Methods

### Get the flowchart data

```javascript
// As an object
flowy.output()
// As a JSON string
JSON.stringify(flowy.output())
```

The JSON object that gets outputted looks like this:

```javascript
[
	html: "",
	blockarr: [],
	blocks: [
		{
			"id": 1,
			"parent": 0,
			"data": [
				{
				"name": "blockid",
				"value": "1"
				}
			],
			"attr": [
				{
				"id": "block-id",
				"class": "block-class"
			]
		}
	]
]
```

Here's what each property means:

| Key        | Value type         | Description                                                                      |
| ---------- | ------------------ | -------------------------------------------------------------------------------- |
| `html`     | _string_           | Contains the canvas data                                                         |
| `blockarr` | _array_            | Contains the block array generated by the library (for import purposes)          |
| `blocks`   | _array_            | Contains the readable block array                                                |
| `id`       | _integer_          | Unique value that identifies a block                                             |
| `parent`   | _integer_          | The `id` of the parent a block is attached to (-1 means the block has no parent) |
| `data`     | _array of objects_ | An array of all the inputs within a certain block                                |
| `name`     | _string_           | The name attribute of the input                                                  |
| `value`    | _string_           | The value attribute of the input                                                 |
| `attr`     | _array of objects_ | Contains all the data attributes of a certain block                              |

### Import the flowchart data

```javascript
flowy.import(output)
```

Allows you to import entire flowcharts initially exported using the previous method, `flowy.output()`

| Parameter | Type                     | Description                    |
| --------- | ------------------------ | ------------------------------ |
| `output`  | _javascript DOM element_ | The data from `flowy.output()` |

### Delete all blocks

To remove all blocks at once use:

```javascript
flowy.deleteBlocks()
```

Currently there is no method to individually remove blocks. The only way to go about it is by splitting branches manually.

#

Feel free to reach out to me through email at hi@alyssax.com or [on Twitter](https://twitter.com/alyssaxuu) if you have any questions or feedback! Hope you find this useful 💜
