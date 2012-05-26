var nextTarget = null;
var nextWasChosen = false;

function new_game() {
	nextTarget = null;
	nextWasChosen = false;
}

function make_move() {
	alternate_target();
	if (nextTarget) {
		var move = nextTarget.move();
		if (move == TAKE) {
			nextTarget = null;
			nextWasChosen = false;
		}
		return move;
	}
	return PASS;
}

function Target(x, y, item) {
	this.x = x;
	this.y = y;
	this.item = item;
}

Target.prototype.move = function() {
	var x = get_my_x();
	var y = get_my_y();
	if (x != this.x) {
		if (x < this.x) return EAST;
		return WEST;
	} else if (y != this.y) {
		if (y < this.y) return SOUTH;
		return NORTH;
	}
	return TAKE;
}

Target.prototype.distance = function(x, y) {
	return Math.abs(x - this.x) + Math.abs(y - this.y);
}

// Selecting the next target to go after

function alternate_target() {
	if (nextWasChosen) return;
	var desired = desired_targets();
	if (desired.length == 0) return;
	var targets = reachable_targets(desired);
	if (targets.length == 0 && nextTarget == undefined) {
		nextTarget = best_unreachable_target(desired);
		nextWasChosen = false;
	} else if (targets.length > 0) {
		targets = sort_reachable_targets(targets);
		nextTarget = targets[0];
		nextWasChosen = true;
	}
}

// Filtering items

function desires_item(item) {
	if (!has_item(item)) return false;
	var total = get_total_item_count(item);
	var myCount = get_my_item_count(item);
	var oppCount = get_opponent_item_count(item);
	var freeCount = total - (myCount + oppCount);
	if (myCount > total / 2.0) return false;
	if (freeCount + myCount < total / 2.0) return false;
	return true;
}

function desired_targets() {
	var board = get_board();
	var targets = new Array();
	for (var x = 0; x < board.length; x++) {
		for (var y = 0; y < board[x].length; y++) {
			var item = board[x][y];
			if (!desires_item(item)) continue;
			targets.push(new Target(x, y, item));
		}
	}
	return targets;
}

/**
 * Filter array of targets for those which we can reach before
 * the opponent.
 */
function reachable_targets(targets) {
	var reachable = new Array();
	var myX = get_my_x();
	var myY = get_my_y();
	var oppX = get_opponent_x();
	var oppY = get_opponent_y();
	for (var i = 0; i < targets.length; i++) {
		var target = targets[i];
		if (target.distance(myX, myY) < target.distance(oppX, oppY)) {
			reachable.push(target);
		}
	}
	return reachable;
}

/**
 * Sort reachable targets based on the distance between us and the opponent.
 */
function sort_reachable_targets(_targets) {
	var targets = _targets.slice(0);
	var myX = get_my_x();
	var myY = get_my_y();
	var oppX = get_opponent_x();
	var oppY = get_opponent_y();

	var changed = false;
	do {
		changed = false;
		for (var i = 0; i < targets.length - 1; i++) {
			var target1 = targets[i];
			var target2 = targets[i + 1];
			var difference1 = target1.distance(oppX, oppY) - target1.distance(myX, myY);
			var difference2 = target1.distance(oppX, oppY) - target1.distance(myX, myY);
			if (difference2 < difference1) {
				targets[i] = target2;
				targets[i + 1] = target1;
			}
		}
	} while (changed);
	return targets;
}

/**
 * In the case of no reachable target, this returns the most favorable target
 * for us to go after.
 */
function best_unreachable_target(targets) {
	var myX = get_my_x();
	var myY = get_my_y();
	var oppX = get_opponent_x();
	var oppY = get_opponent_y();

	var best = null;
	var ratio = 0;
	for (var i = 0; i < targets.length; i++) {
		var target = targets[i];
		var distRatio = target.distance(oppX, oppY) / target.distance(myX, myY);
		if (distRatio < ratio || !best) {
			best = target;
			ratio = distRatio;
		}
	}
	return best;
}
