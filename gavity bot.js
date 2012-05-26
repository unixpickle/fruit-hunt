function new_game() {
}

function make_move() {
	var board = get_board();
	// we found an item! take it!
	

	var statList = item_stat_list(board);
	var vector = new ForceVector(0, 0);
	for (var i = 0; i < statList.length; i++) {
		var stat = statList[i];
		vector = vector.add(stat.force_on_point(get_my_x(), get_my_y()));
	}
	
	if (board[get_my_x()][get_my_y()] > 0) {
		var item = board[get_my_x()][get_my_y()];
		var need = need_for_item(item);
		if (vector.magnitude() < need) {
			return TAKE;
		}
	}

	return vector.direction();
}

function item_stat_list(board) {
	var stats = new Array();
	for (var x = 0; x < board.length; x++) {
		for (var y = 0; y < board[x].length; y++) {
			if (board[x][y] == 0) continue;
			var item = board[x][y];
			var need = need_for_item(item);
			if (need == 0) continue;
			var stat = new ItemStatistic(x, y, item, need);
			stats.push(stat);
		}
	}
	return stats;
}

function need_for_item(item) {
	var myCollected = get_my_item_count(item);
	var oppCollected = get_opponent_item_count(item);
	var total = get_total_item_count(item);
	var free = total - (myCollected + oppCollected);
	if (myCollected > total / 2) return 0;
	if (oppCollected > myCollected && myCollected + free < oppCollected) {
		return 0;
	}
	return (oppCollected + 1) / (myCollected + 1);
}

function point_distance(x, y, x2, y2) {
	return Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
}

function ItemStatistic(x, y, item, need) {
	this.x = x;
	this.y = y;
	this.item = item;
	this.need = need;
}

ItemStatistic.prototype.force_on_point = function (x, y) {
	// TODO: some sort of weighting here involving the enemy's ability
	// to reach the object as well...
	var angle = Math.atan2(this.y - y, this.x - x);
	var mass = this.need;
	var dist = point_distance(x, y, this.x, this.y);
	if (dist == 0) return new ForceVector(0, 0);
	var magnitude = mass / Math.pow(dist, 2);
	var x = Math.cos(angle) * magnitude;
	var y = Math.sin(angle) * magnitude;
	// console.log('FoP: (x,y)=(' + x + ',' + y + ')');
	return new ForceVector(x, y);
}

function ForceVector(x, y) {
	this.x = x;
	this.y = y;
}

ForceVector.prototype.add = function (vect) {
	// console.log('adding (' + vect.x + ',' + vect.y + ') to (' + this.x + ',' + this.y + ')');
	return new ForceVector(this.x + vect.x, this.y + vect.y);
}

ForceVector.prototype.magnitude = function () {
	return point_distance(0, 0, this.x, this.y);
}

ForceVector.prototype.direction = function () {
	if (this.magnitude() == 0) return EAST;
	
	var angle = Math.atan2(-this.y, this.x) * (180 / Math.PI);
	if (angle < 0) {
		angle = 360 + angle;
	}
	// console.log('angle: ' + angle);
	if (angle <= 45 || angle >= 315) {
		return EAST;
	}
	if (angle < 315 && angle >= 225) {
		return SOUTH;
	}
	if (angle < 225 && angle >= 135) {
		return WEST;
	}
	return NORTH;
}
