let arr1 = [];
arr1.push("some");
arr1.push("more");
arr1.push("stuff");
let arr2 = ["hello", "world"];
let arr3 = [];
arr3.push("banana");
console.log(arr1.concat("one", arr2, ["static"], "two", arr3, "three"));
console.log([1, 2, 3].concat(20, 30));
