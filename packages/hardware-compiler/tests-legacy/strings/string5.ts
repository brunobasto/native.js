var s;

s = 5 + "";
if (5 == s)
    console.log("s:", s);

s = s + "something" + s + (+s + 4);

console.log(s, s.lastIndexOf("5"));
