(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "BaldnessJs/baldness"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var baldness_1 = require("BaldnessJs/baldness");
    var sourceTest1Bis = "<div>\n  <b>Albert Einstein</b><br/>\n  <desc>He was a German-born theoretical physicist. He developed the theory of relativity ... (from Wikipedia)</desc>\n</div>\n<div>\n  <b>Marie Curie</b><br/>\n  <i>female</i><br/>\n  <desc>Marie Sk\u0142odowska Curie (/\u02C8kj\u028Ari, kj\u028A\u02C8ri\u02D0/;[2] French: [ky\u0281i]; Polish: [k\u02B2i\u02C8ri]; 7 November 1867 \u2013 4 July 1934),\nborn Maria Salomea Sk\u0142odowska ([\u02C8marja sal\u0254\u02C8m\u025Ba skw\u0254\u02C8d\u0254fska]),\nwas a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity.(from Wikipedia)\n</desc>\n</div>\n<div>\n  <b>Niels Bohr</b><br/>\n  <i>male</i><br/>\n</div>";
    var sourceTest1 = "<div>\n  <b>Marie Curie</b><br/>\n  <i>female</i><br/>\n  <desc>Marie Sk\u0142odowska Curie (/\u02C8kj\u028Ari, kj\u028A\u02C8ri\u02D0/;[2] French: [ky\u0281i]; Polish: [k\u02B2i\u02C8ri]; 7 November 1867 \u2013 4 July 1934),\nborn Maria Salomea Sk\u0142odowska ([\u02C8marja sal\u0254\u02C8m\u025Ba skw\u0254\u02C8d\u0254fska]),\nwas a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity.(from Wikipedia)\n</desc>\n</div>\n";
    var sourceTest1Ter = "<div>\n  <b>Albert Einstein</b><br/>\n  <desc>He was a German-born theoretical physicist.\n  He developed the theory of relativity ... (from Wikipedia)</desc>\n</div>\n";
    var tplTest1 = "{{#person}}<div>\n  <b>{{name}}</b><br/>\n{{#gender?}}  <i>{{value}}</i><br/>\n{{/gender}}{{#description}}  <desc>{{text([^]*)}}</desc>\n{{/description}}</div>\n{{/person}}";
    var tplTest3 = 'test of a template with no section {{var1}} ... {{var2}}...';
    var tplTest4 = 'test of a template with no section {handlebars which have no sense}} {{ } #{}/ and finishing with a mustache {{var1}} ... {{var2}}';
    var sourceTest2 = "I have 3 dollars in my pocket and I want to buy a sandwich.";
    var tplTest5 = "I have {{money}} dollars in my pocket and I want to buy {{thing}}.";
    var sourceTest3 = "I have 3 dollars in my pocket and I want to buy a sandwich. My pants are blue.";
    var tplTest6 = "I have {{money}} dollars in my pocket and I want to buy {{thing}}.{{#clothes}} {{cloth}} are {{color}}.{{/clothes}}";
    var tplTest7 = "I have {{money}} dollars in my pocket and I want to buy {{thing([^.]*)}}.{{#clothes?}} {{cloth}} are {{color}}.{{/clothes}}";
    // Activate the verbose mode for BaldnessJs
    baldness_1.default.debugOn();
    function test1() {
        console.group('Preliminary tests, while finding simple sections position in TPL');
        var firstLevelSections = baldness_1.default._findSections(tplTest1);
        console.assert(firstLevelSections.length === 1, 'Nb of Sections of first level should be 1');
        console.assert(firstLevelSections[0].position.raw.begin === 0, 'The begin of the first section should be 0');
        console.log('firstLevelSections', firstLevelSections);
        var secondLevelSections = baldness_1.default._findSections(firstLevelSections[0].src);
        console.assert(secondLevelSections.length === 2, 'Nb of Sections of second level should be 2');
        console.assert(secondLevelSections[0].position.raw.begin === 31, 'The begin of the first section of the second level is 31');
        console.log('secondLevelSections', secondLevelSections);
        console.groupEnd();
    }
    function test2() {
        console.group('Tests of a full compilation of the TPL');
        var AST = baldness_1.default.compile(tplTest1);
        console.assert(AST.children.length === 2, "AST should have 2 children wich are the section 'person' and the final text");
        console.assert(AST.children[0].children.length === 7, "The first level section should have 7 children");
        console.log('AST', AST);
        var regeneratedTpl = baldness_1.default.regenerateTpl(AST);
        console.log('Original src of tpl', tplTest1);
        console.log('Regenerated src of tpl', regeneratedTpl);
        console.assert(regeneratedTpl === tplTest1, 'The regenerated TPL from AST must be equal to original TPL');
        console.groupEnd();
    }
    function test3() {
        console.group('Tests of a full compilation of a TPL without any section');
        var AST = baldness_1.default.compile(tplTest3);
        console.assert(AST.children.length === 5, "AST has 5 children");
        console.log('AST', AST);
        console.groupEnd();
    }
    function test4() {
        console.group('Tests of a full but very simple parse');
        var result = baldness_1.default.parse(sourceTest2, tplTest5);
        console.log('AST', baldness_1.default.getLastAST());
        console.log('Result', result);
        console.groupEnd();
    }
    function test5() {
        console.group('Tests of a more complex parse');
        var result = baldness_1.default.parse(sourceTest3, tplTest6);
        console.log('AST', baldness_1.default.getLastAST());
        console.log('Result', result);
        console.groupEnd();
    }
    function test6() {
        console.group('Tests of a simple tpl with a non-mandatory section');
        var AST = baldness_1.default.compile(tplTest7);
        console.log('AST', AST);
        console.assert(AST.children.length === 6, "There must be 6 children");
        console.assert(AST.children[5].type === "section");
        var result = baldness_1.default.parse(sourceTest2, AST);
        console.log('Result', result);
        console.assert(result.clothes === undefined, "The section does not appear in source, so it must not appear in result");
        result = baldness_1.default.parse(sourceTest3, AST);
        console.log('Result', result);
        console.assert(result.clothes !== undefined, "The section appears in source, so it must appear in result");
        console.groupEnd();
    }
    function test7() {
        console.group('Tests of a parse of simple html source');
        var result = baldness_1.default.parse(sourceTest1Ter, tplTest1);
        var AST = baldness_1.default.getLastAST();
        console.log('AST', AST);
        console.log('Result', result);
        console.assert(result.person, 'Person has not been recognised');
        console.assert(result.person.name === 'Albert Einstein', 'Person has not been recognised');
        result = baldness_1.default.parse(sourceTest1, tplTest1);
        AST = baldness_1.default.getLastAST();
        console.log('AST', AST);
        console.log('Result', result);
        console.groupEnd();
    }
    //
    // Here is the execution of tests
    //
    function exec() {
        console.log('The tests below pass if there is no error in the console log');
        /*test1()
        test2()
        test3()
        test4()
        test5()
        test6()*/
        test7();
    }
    exports.exec = exec;
});
//# sourceMappingURL=main.js.map