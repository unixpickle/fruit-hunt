function new_game() {
}

function make_move() {
	var next = find_next_target();
	if (next == undefined) {
		console.log('lol something bad happened');
		return PASS;
	}
	
	var x = get_my_x();
	var y = get_my_y();
	if (next.x != x) {
		if (x < next.x) return EAST;
		else return WEST;
	} else if (next.y != y) {
		if (y < next.y) return SOUTH;
		else return NORTH;
	} else {
		return TAKE;
	}
	
	return PASS;
}

function target_groups() {
	var groups = new Object();
	var board = get_board();
	for (var x = 0; x < board.length; x++) {
		for (var y = 0; y < board[x].length; y++) {
			var item = board[x][y];
			if (!has_item(item)) continue;
			if (item_required_count(item) == 0) continue;
			var list = groups[item];
			if (!list) {
				list = new Array();
				groups[item] = list;
			}
			list.push(new Target(x, y, item));
		}
	}
	return groups;
}

function find_next_target() {
	var groups = target_groups();
	var paths = target_paths(groups);
	var target = null, distance = 10000;
	var targets = new Array();
	for (var item in paths) {
		targets.push(paths[item][0]);
	}
	targets = make_target_path([], targets, targets.length, 10000);
	if (!targets) return null;
	return targets[0];
	/*
	for (var item in paths) {
		var path = paths[item];
		var length = target_path_length(path);
		if (length < distance) {
			target = path[0];
			distance = length;
		}
	}
	*/
	return target;
}

// Sorting Targets

function target_paths(groups) {
	var paths = new Object();
	for (var item in groups) {
		var req = item_required_count(item);
		var targets = make_target_path([], groups[item], req, 10000);
		if (targets) {
			paths[item] = targets;
		}
	}
	return paths;
}

function item_required_count(item) {
	var total = get_total_item_count(item);
	var myCount = get_my_item_count(item);
	var oppCount = get_opponent_item_count(item);
	var free = total - (myCount + oppCount);
	var needed = total / 2.0;
	if (myCount > needed) return 0;
	if (myCount + free < needed) return 0;
	return needed - myCount;
}

function make_target_path(usedTargets, targets, req, minDistance) {
	if (usedTargets.length >= req && usedTargets.length > 0) {
		var length = target_path_length(usedTargets);
		if (length < minDistance) {
		//	console.log('DICKHEAD');
			return usedTargets;
		}
		return null;
	} else if (target_path_length(usedTargets) > minDistance) {
		return null;
	}
	
	var oppX = get_opponent_x(), oppY = get_opponent_y();
	var myX = get_my_x(), myY = get_my_y();
	
	var useMin = 10000;
	var retPath = null;
	for (var i = 0; i < targets.length; i++) {
		var target = targets[i];
		if (target.distance(myX, myY) > target.distance(oppX, oppY)) {
			if (usedTargets.length == 0) continue;
		}
		
		var newUsedTargets = usedTargets.slice(0);
		var newTargets = targets.slice(0);
		newTargets.splice(i, 1);
		newUsedTargets.push(target);
		
		var path = make_target_path(newUsedTargets, newTargets, req, useMin);
		if (path) {
			useMin = target_path_length(path);
			retPath = path;
		}
	}
	return retPath;
}

function target_path_length(targets) {
	if (targets.length == 0) return 0;
	var length = 0;
	var start = targets[0];
	length += Math.abs(get_my_x() - start.x);
	length += Math.abs(get_my_y() - start.y);
	for (var i = 1; i < targets.length; i++) {
		length += targets[i].distance(targets[i - 1]);
	}
	return length;
}

// Target Class

function Target(x, y, item) {
	this.x = x;
	this.y = y;
	this.item = item;
}

/**
 * Gives the number of moves it would take to get to a given point.
 * This can be used in either of these two ways:
 *  @param target The X value
 *  @param opt The Y value
 * or:
 *  @param target Another target from which the distance will be returned
 *  @param opt Always null or undefined
 */
Target.prototype.distance = function(target, opt) {
	if (opt != undefined) {
		// target = x, opt = y
		return Math.abs(target - this.x) + Math.abs(opt - this.y);
	}
	return Math.abs(target.x - this.x) + Math.abs(target.y - this.y);
}
