// Test array inside object
let obj = {};
obj["arr"] = [1, 2, 3];
console.log(obj);

let a = {};
a.foo = [1, 2, 3, 5];
a.foo.push(6);
console.log(a.foo);
