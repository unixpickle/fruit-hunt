var currentPath = null;
var currentOutcome = 0;
var calcTime = null;
var thinkTime = 9.5;

function new_game() {
	currentPath = null;
	currentOutcome = 0;
	calcTime = null;
	thinkTime = 9.5;
}

function make_move() {
	var board = get_board();
	// we found an item! take it!
	var recalced = false;
	recalced = true;
	generate_solution_path();
	/*if (currentPath || currentOutcome == 1) {
		if (!currentPath.isAvailable()) {
			recalced = true;
			generate_solution_path();
		}
	} else {
		recalced = true;
		generate_solution_path();
	}*/
	
	if (!currentPath) {
		// console.log('no current path!');
		return PASS;
	}
	
	// console.log('there is a current path');
	
	var next = currentPath.nextItem();
	if (!next) {
		if (!recalced) {
			generate_solution_path();
		}
		if (!currentPath) return PASS;
		next = currentPath.nextItem();
		if (!next) return PASS;
	}
	
	var x = get_my_x(), y = get_my_y();
	if (x != next.x) {
		if (x < next.x) return EAST;
		return WEST;
	} else if (y != next.y) {
		if (y < next.y) return SOUTH;
		return NORTH;
	} else {
		currentPath.nextTake += 1;
		return TAKE;
	}
}

// Recursive path generation

function generate_solution_path(path, requirements) {
	if (!path) {
		calcTime = new Date();
		currentOutcome = 0;
		currentPath = null;
		// create a now path, etc.
		var available = sort_grid_items(collect_grid_items());
		var thePath = new SolutionPath([], available);
		var theReqs = new BoardRequirements();
		// console.log(thePath.available);
		return generate_solution_path(thePath, theReqs);
	}
	if (new Date().getTime() > calcTime.getTime() + 1000*thinkTime) {
		return;
	}
	var outcome = requirements.solutionOutcome(path);
	if (outcome == 1) {
		if (currentOutcome != 1) {
			currentOutcome = 1;
			currentPath = path;
		} else {
			if (path.better_than(currentPath)) {
				currentPath = path;
			}
		}
		return;
	} else if (outcome == 2) {
		if (currentOutcome == 0) {
			currentPath = path;
		} else if (currentOutcome == 2) {
			if (path.better_than(currentPath)) {
				currentPath = path;
			}
		}
		return;
	} else if (outcome == 0 && currentOutcome == 0) {
		currentPath = path;
	}
	var subPaths = path.branchPaths(requirements);
	for (var i = 0; i < subPaths.length; i++) {
		generate_solution_path(subPaths[i], requirements);
	}
}

// Board Requirements

function BoardRequirements() {
	this.requirements = new Object();
	this.groupsNeeded = 0;
	var board = get_board();
	
	// ambiguous documentation about getting items leads me to do this...
	for (var i = 1; i <= get_number_of_item_types(); i++) {
		this.requirements[i] = get_total_item_count(i) / 2.0;
	}
	for (var x = 0; x < board.length; x++) {
		for (var y = 0; y < board[x].length; y++) {
			var item = board[x][y];
			if (item == 0) continue;
			this.requirements[item] = get_total_item_count(item) / 2.0;
		}
	}
	this.groupsNeeded = get_number_of_item_types() / 2.0;
	
}

BoardRequirements.prototype.solutionOutcome = function(solutionPath) {
	// return 0 for loss,
	// return 1 for victory
	// return 2 for tie
	var obtainedGroups = 0;
	var tiedGroups = 0;
	for (var key in this.requirements) {
		var solutionNumber = solutionPath.numberOfItem(key);
		var taken = get_my_item_count(key);
		var totalCount = solutionNumber + taken;
		if (totalCount > this.requirements[key]) {
			obtainedGroups += 1;
		} else if (totalCount == this.requirements[key]) {
			tiedGroups += 1;
		}
	}
	// console.log(obtainedGroups + ' groups');
	if (obtainedGroups > this.groupsNeeded) {
		return 1;
	} else if (obtainedGroups == this.groupsNeeded) {
		return 2;
	}
	return 0;
}

BoardRequirements.prototype.itemSatisfied = function(solutionPath, item) {
	var count = solutionPath.numberOfItem(item);
	count += get_my_item_count(item);
	if (count > this.requirements[item]) return true;
	// it may be that the item has to be satisfied because there is no way
	// to collect enough of it...
	//var available = solutionPath.availableOfItem(item);
	//if (available + count < this.requirements[item]) return true;
	
	// there is still a chance to get a majority or a tie!
	return false;
}

// Solution Path

function SolutionPath(followed, available) {
	this.followed = followed;
	this.available = available;
	this.nextTake = 0;
}

SolutionPath.prototype.numberOfItem = function(itemID) {
	var count = 0;
	for (var i = 0; i < this.followed.length; i++) {
		var item = this.followed[i];
		if (item.item == itemID) count++;
	}
	return count;
}

SolutionPath.prototype.availableOfItem = function(itemID) {
	var count = 0;
	for (var i = 0; i < this.available.length; i++) {
		var item = this.available[i];
		if (item.item == itemID) count++;
	}
	return count;
}

SolutionPath.prototype.branchPaths = function(requirements) {
	var list = new Array();
	var sortedItems = sort_grid_items(this.available);
	for (var i = 0; i < sortedItems.length; i++) {
		var branchItem = sortedItems[i];
		if (requirements.itemSatisfied(this, branchItem.item)) continue;
		
		var followed = this.followed.slice(0);
		var available = sortedItems.slice(0);
		
		// move branch item to followed
		var index = available.indexOf(branchItem);
		available.splice(index, 1);
		followed.push(branchItem);
		
		var path = new SolutionPath(followed, available);
		list.push(path);
	}
	// console.log('there are ' + list.length + ' branches');
	return list;
}

SolutionPath.prototype.better_than = function(path) {
	if (this.pathLength() * this.enemyCoefficient > path.pathLength * path.enemyCoefficient) return false;
	return true;
}

SolutionPath.prototype.pathLength = function() {
	if (this.followed.length == 0) return 0;
	var x = get_my_x();
	var y = get_my_y();
	var oppX = get_opponent_x();
	var oppY = get_opponent_y();
	var distance = 0;
	distance = Math.abs(x - this.followed[0].x) + Math.abs(y - this.followed[0].y);
	for (var i = 1; i < this.followed.length; i++) {
		distance += this.followed[i].distance(this.followed[i - 1]);
	}
	return distance;
}

SolutionPath.prototype.enemyCoefficient = function() {
	return 1; // for now, no enemy compensation
	/*
	var x = get_my_x();
	var y = get_my_y();
	var oppX = get_opponent_x();
	var oppY = get_opponent_y();
	var distance = 0;
	distance = Math.abs(x - this.followed[0].x) + Math.abs(y - this.followed[0].y);
	var oppDistance = Math.abs(oppX - this.followed[0].x) + Math.abs(oppY - this.followed[0].y);
	return (oppDistance / distance);*/
}

SolutionPath.prototype.isAvailable = function() {
	var board = get_board();
	for (var i = this.nextTake; i < this.followed.length; i++) {
		var item = this.followed[i];
		if (board[item.x][item.y] == 0) return false;
	}
	return true;
}

SolutionPath.prototype.nextItem = function() {
	if (this.nextTake >= this.followed.length) return null;
	return this.followed[this.nextTake];
}

// Grid Items

function collect_grid_items() {
	var board = get_board();
	var items = new Array();
	for (var x = 0; x < board.length; x++) {
		for (var y = 0; y < board[x].length; y++) {
			var item = board[x][y];
			if (item == 0) continue;
			var theItem = new GridItem(x, y, item);
			items.push(theItem);
		}
	}
	return sort_grid_items(items);
}

function sort_grid_items(items) {
	if (items.length <= 1) return items;
	var changed = true;

	return sort_preferred_items(items);
}

function item_need(item) {
	var totalCount = get_total_item_count(item);
	var myCount = get_my_item_count(item);
	var toWin = Math.ceil(totalCount / 2.0);
	var available = totalCount - get_opponent_item_count(item) - myCount;
	var toGain = toWin - myCount;
	if (toGain <= 0) return 0;
	if (toGain > available) return 0;
	return toGain / available;
}

function sort_preferred_items(items) {
	var changed = true;
	while (changed) {
		changed = false;
		for (var i = 0; i < items.length - 1; i++) {
			var item1 = items[i];
			var item2 = items[i + 1];
			if (preferred_item(item1, item2, items) == item2) {
				items[i + 1] = item1;
				items[i] = item2;
				changed = true;
			}
		}
	}
	return items;
}

function preferred_item(item1, item2, items) {
	var x = get_my_x();
	var y = get_my_y();
	var oppX = get_opponent_x();
	var oppY = get_opponent_y();
	
	var ourDist1 = Math.abs(x - item1.x) + Math.abs(y - item1.y);
	var ourDist2 = Math.abs(x - item2.x) + Math.abs(y - item2.y);
	
	var oppDist1 = Math.abs(oppX - item1.x) + Math.abs(oppY - item1.y);
	var oppDist2 = Math.abs(oppX - item2.x) + Math.abs(oppY - item2.y);
	
	if (ourDist1 == 0) return item1;
	if (ourDist2 == 0) return item2;
	
	var dist1 = item_need(item1.item) / ourDist1;
	var dist2 = item_need(item2.item) / ourDist2;
	if (dist1 == dist2) return item1;
	if (dist1 > dist2) {
		return item1;
	}
	return item2;
}

function GridItem(x, y, item) {
	this.x = x;
	this.y = y;
	this.item = item;
}

GridItem.prototype.distance = function(item) {
	// the number of moves it would take to get from a to b
	return Math.abs(this.x - item.x) + Math.abs(this.y - item.y);
}

GridItem.prototype.average_distance = function(items) {
	var sum = 0, count = 0;
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		if (item == this) continue;
		sum += this.distance(item);
		count += 1;
	}
	return sum / count;
}
