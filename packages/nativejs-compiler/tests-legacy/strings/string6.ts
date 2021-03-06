let matched = 0;
let count = 0;
function print(string, regex, expect) {
  count++;
  let pos = string.search(regex);
  if (pos != expect)
    console.log(
      '"' +
        string +
        '".search(' +
        regex +
        ") -> FAIL, returned " +
        pos +
        ", expected " +
        expect
    );
  else matched++;
}

print("nnda", /n*.a/, 0);
print("nna", /n*a/, 0);
print("a", /n*a/, 0);
print("a", /n.*a/, -1);
print("nda", /n.*a/, 0);
print("naa", /n.*a/, 0);
print("ana", /n.*a/, 1);
print("nddna", /n.a/, -1);
print("nnada", /n*a*d/, 0);
print("naaada", /n*a*d/, 0);
print("d", /n*a*d/, 0);
print("x", /n*a*d/, -1);
print("nnaed", /nn*a*d/, -1);
print("abcdefff23334", /.*a.*ff*23335*4/, 0);
print("abcdefff23334", /ff*23335*/, 5);
print("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxy", /(x+x+)+y/, 0);
print("acb", /a.b/, 0);
print("abc", /abc/, 0);
print("xbc", /abc/, -1);
print("axc", /abc/, -1);
print("abx", /abc/, -1);
print("xabcy", /abc/, 1);
print("ababc", /abc/, 2);
print("abc", /ab*c/, 0);
print("abc", /ab*bc/, 0);
print("abbc", /ab*bc/, 0);
print("abbbbc", /ab*bc/, 0);
print("abbc", /ab+bc/, 0);
print("abc", /ab+bc/, -1);
print("abq", /ab+bc/, -1);
print("abbbbc", /ab+bc/, 0);
print("abbc", /ab?bc/, 0);
print("abc", /ab?bc/, 0);
print("abbbbc", /ab?bc/, -1);
print("abc", /ab?c/, 0);
print("abc", /^abc$/, 0);
print("abcc", /^abc$/, -1);
print("abcc", /^abc/, 0);
print("aabc", /^abc$/, -1);
print("aabc", /abc$/, 1);
print("ababcabc", /abc$/, 5);
print("abc", /a.c/, 0);
print("axc", /a.c/, 0);
print("axyzc", /a.*c/, 0);
print("axyzd", /a.*c/, -1);
print("abc", /a[bc]d/, -1);
print("abd", /a[bc]d/, 0);
print("abd", /a[b-d]e/, -1);
print("ace", /a[b-d]e/, 0);
print("aac", /a[b-d]/, 1);
print("a-", /a[-b]/, 0);
print("a-", /a[\-b]/, 0);
print("a]", /a]/, 0);
print("aed", /a[^bc]d/, 0);
print("abd", /a[^bc]d/, -1);
print("adc", /a[^-b]c/, 0);
print("a-c", /a[^-b]c/, -1);
print("a]c", /a[^]b]c/, -1);
print("adc", /a[^]b]c/, -1);
print("abc", /ab|cd/, 0);
print("abcd", /ab|cd/, 0);
print("def", /()ef/, 1);
print("b", /$b/, -1);
print("a(b", /a\(b/, 0);
print("ab", /a\(*b/, 0);
print("a((b", /a\(*b/, 0);
print("a\\b", /a\\b/, 0);
print("abc", /((a))/, 0);
print("abc", /(a)b(c)/, 0);
print("aabbabc", /a+b+c/, 4);
print("ab", /(a+|b)*/, 0);
print("ab", /(a+|b)+/, 0);
print("ab", /(a+|b)?/, 0);
print("cde", /[^ab]*/, 0);
print("", /abc/, -1);
print("", /a*/, 0);
print("e", /a|b|c|d|e/, 0);
print("ef", /(a|b|c|d|e)f/, 0);
print("abcdefg", /abcd*efg/, 0);
print("xabyabbbz", /ab*/, 1);
print("xayabbbz", /ab*/, 1);
print("abcde", /(ab|cd)e/, 2);
print("hij", /[abhgefdc]ij/, 0);
print("abcde", /^(ab|cd)e/, -1);
print("abcdef", /(abc|)ef/, 4);
print("abcd", /(a|b)c*d/, 1);
print("abc", /(ab|ab*)bc/, 0);
print("abc", /a([bc]*)c*/, 0);
print("abcd", /a([bc]*)(c*d)/, 0);
print("abcd", /a([bc]+)(c*d)/, 0);
print("abcd", /a([bc]*)(c+d)/, 0);
print("adcdcde", /a[bcd]*dcdcde/, 0);
print("adcdcde", /a[bcd]+dcdcde/, -1);
print("abc", /(ab|a)b*c/, 0);
print("abcd", /((a)(b)c)(d)/, 0);
print("alpha", /[a-zA-Z_][a-zA-Z0-9_]*/, 0);
print("abh", /^a(bc+|b[eh])g|.h$/, 1);
print("effgz", /(bc+d$|ef*g.|h?i(j|k))/, 0);
print("ij", /(bc+d$|ef*g.|h?i(j|k))/, 0);
print("effg", /(bc+d$|ef*g.|h?i(j|k))/, -1);
print("bcdd", /(bc+d$|ef*g.|h?i(j|k))/, -1);
print("reffgz", /(bc+d$|ef*g.|h?i(j|k))/, 1);
print("a", /(((((((((a)))))))))/, 0);
print("uh-uh", /multiple words of text/, -1);
print("multiple words, yeah", /multiple words/, 0);
print("abcde", /(.*)c(.*)/, 0);
print("(a, b)", /\((.*); (.*)\)/, -1);
print("ab", /[k]/, -1);
print("ac", /a[-]?c/, 0);
print("ab", /(a)(b)c|ab/, 0);
print("aaax", /(a)+x/, 0);
print("aacx", /([ac])+x/, 0);
print("d:msgs/tdir/sub1/trial/away.cpp", /([^\/]*\/)*sub1\//, 0);
print("sub1/trial/away.cpp", /([^\/]*\/)*sub1\//, 0);
print("some/things/sub2/sub1.cpp", /([^\/]*\/)*sub1\//, -1);
print("track1.title:TBlah blah blah", /([^.]*)\.([^:]*):[T ]+(.*)/, 0);
print("abNNxyzN", /([^N]*N)+/, 0);
print("abNNxyz", /([^N]*N)+/, 0);
print("abcx", /([abc]*)x/, 0);
print("abc", /([abc]*)x/, -1);
print("abcx", /([xyz]*)x/, 3);
print("aac", /(a)+b|aac/, 0);
print("<html>", /<(ht)*m/, 0);

console.log("Passed:", matched, "/", count);
