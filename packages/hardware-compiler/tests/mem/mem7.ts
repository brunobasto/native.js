const map = { };

let value = 0;

while (value < 10) {
	value++;
	if (value % 2 == 0) {
		const key1 = 'key1_' + value;
		// escapes
		map[key1] = value;

		// doesnt escape
		const insideMap = {};
		const key2 = 'key2_' + value;
		insideMap[key2] = value;
		console.log('add value', value);
	}
	else {
		console.log('skip value', value);
	}
}

let size = 0;
for (let k in map) size++;

console.log('total values added', size);