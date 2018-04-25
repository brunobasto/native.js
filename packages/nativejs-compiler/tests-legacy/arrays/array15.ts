let i = 0;
let arr1 = [10, 20, 30, 100];
let arr2 = ["hello", "world", "bar", "foo"];
let slice1 = arr1.slice(0, 2);
let slice2 = arr1.slice(i + 2, -1);
slice2.push(33);
let slice3 = arr2.slice(1, i - 1);
slice3.unshift("apple");
let slice4 = arr2.slice(0, -2);
console.log(slice1);
console.log(slice2);
console.log(slice3);
console.log(slice4);
console.log(arr1.slice(2, -2));
console.log(arr1.slice(-3, 3));
console.log(arr2.slice(3));
console.log(arr1);
console.log(arr2);

// TODO: out of bounds index
