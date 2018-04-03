const map = { };

let value = 0;

function loop() {
	value++;
	const key = "key_" + value;
	map[key] = value;
}

while (value < 10) {
	loop();
}

let size = 0;
for (let k in map) size++;

console.log(size);