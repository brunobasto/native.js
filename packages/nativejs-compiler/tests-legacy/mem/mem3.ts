function nested() {
  let obj = { key: "something" };
  return obj;
}

function func() {
  let x = nested();
  console.log(x);
}

func();
