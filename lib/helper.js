function string2Elemnt(html) {
    var parser =  new DOMParser();
    return parser.parseFromString(html, 'text/html').body.childNodes[0];
}