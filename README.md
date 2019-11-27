# Flowy


![Demo](https://media.giphy.com/media/dv1C56OywrP7Cn20nr/giphy.gif)
<br>A javascript library to create pretty flowcharts with ease ✨

[Dribbble](https://dribbble.com/shots/8576286-Flowy-Flowchart-Engine) | [Twitter](https://twitter.com/alyssaxuu/status/1199724989353730048) | [Live demo](https://alyssax.com/x/flowy)


Flowy makes creating WebApps with flowchart functionality an incredibly simple task. Build automation software, mind mapping tools, or simple programming platforms in minutes by implementing the library into your project. 



Made by [Alyssa X](https://alyssax.com)

## Table of contents
- [Features](#features)
- [Installation](#installation)
- [Running Flowy](#running-flowy)
    - [Initialization](#initialization)
    - [Example](#example)
- [Methods](#methods)
    - [Get the flowchart data](#get-the-flowchart-data)
    - [Delete all blocks](#delete-all-blocks)


## Features
Currently, Flowy supports the following:

 - Responsive drag and drop
 - Automatic snapping
 - Block rearrangement
 - Delete blocks
 - Automatic block centering
 
 You can try out [the demo](https://alyssax.com/x/flowy) to see the library in action.
 

## Installation
Adding Flowy to your WebApp is incredibly simple:
1. Include jQuery to your project
2. Link `flowy.min.js` and `flowy.min.css` to your project

## Running Flowy

### Initialization
```javascript
flowy(canvas, ongrab, onrelease, onsnap, spacing_x, spacing_y);
```

Parameter | Type | Description
--- | --- | ---
   `canvas` | *jQuery object* | The element that will contain the blocks 
   `ongrab` | *function* (optional) |  Function that gets triggered when a block is dragged
   `onrelease` | *function* (optional) |  Function that gets triggered when a block is released
   `onsnap` | *function* (optional) |  Function that gets triggered when a block snaps with another one
   `spacing_x` | *integer* (optional) |  Horizontal spacing between blocks (default 20px)
   `spacing_Y` | *integer* (optional) |  Vertical spacing between blocks (default 80px)

To define the blocks that can be dragged, you need to add the class `.create-flowy`

### Example
**HTML**
```html
<div class="create-flowy">The block to be dragged</div>
<div id="canvas"></div>
```
**Javascript**
```javascript
var spacing_x = 40;
var spacing_y = 100;
// Initialize Flowy
flowy($("#canvas"), onGrab, onRelease, onSnap, spacing_x, spacing_y);
function onGrab(){
	// When the user grabs a block
}
function onRelease(){
	// When the user releases a block
}
function onSnap(){
	// When a block snaps with another one
}
```
## Methods
### Get the flowchart data
```javascript
// As an object
flowy.output();
// As a JSON string
JSON.stringify(flowy.output());
```
The JSON object that gets outputted looks like this:
```javascript
{
	"id": 1,
	"parent": 0,
	"data": [
		{
		"name": "blockid",
		"value": "1"
		}
	]
}
```

Here's what each property means:

Key | Value type | Description
--- | --- | ---
   `id` | *integer* | Unique value that identifies a block 
   `parent` | *integer* |  The `id` of the parent a block is attached to (-1 means the block has no parent)
   `data` | *array of objects* |  An array of all the inputs within the selected block
   `name` | *string* |  The name attribute of the input
   `value` | *string* |  The value attribute of the input

### Delete all blocks
To remove all blocks at once use:
```javascript
flowy.deleteBlocks()
```
Currently there is no method to individually remove blocks. The only way to go about it is by splitting branches manually.
#
 Feel free to reach out to me through email at hi@alyssax.com or [on Twitter](https://twitter.com/alyssaxuu) if you have any questions or feedback! Hope you find this useful 💜
