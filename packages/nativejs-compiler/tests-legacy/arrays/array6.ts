// Test correctly determining array type after initial assignment
let array1 = [];
array1.push("Hello");
console.log(array1);

let array2 = [];
for (let i = 0; i < 5; i++) array2.push(10 * i);
console.log(array2);
