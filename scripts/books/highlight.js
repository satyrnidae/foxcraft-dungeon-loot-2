'use strict';
/**
 * Syntax coloring for the code blocks of books. Prism does the lexing, except for mcfunction, which has a tokenizer of its
 * own here. A theme maps token types to the dark colors
 * that read on the parchment of a book page. highlight(code, language) returns the code as lines of { text, color } pieces,
 * color being undefined for text that keeps the default color, or null when the language is not one of LANGUAGES.
 */
const Prism = require('prismjs');

for (const name of ['json', 'bash', 'python', 'yaml', 'java']) require(`prismjs/components/prism-${name}`);

// Prism has no grammar for mcfunction, and its patterns cannot anchor to the start of a line after an earlier token split
// it. A line is a comment, or a command followed by arguments: the words of execute, selectors, resource names, NBT keys,
// numbers and strings. Returns tokens in the shape of Prism's.
const MCF_ARGS = new RegExp(
    [
        '(?<string>"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\')',
        '(?<selector>@[aenprsv]\\b(?:\\[[^\\]\\n]*\\])?)',
        '(?<resource>#?[a-z0-9_.-]+:[a-z0-9_./-]+)',
        '(?<keyword>\\b(?:run|as|at|if|unless|store|result|success|positioned|rotated|facing|align|anchored|in|on|over|summon|entity|block|score|data|storage|items|loaded|predicate|function|dimension|matches|from|to|with|modify|merge|remove|get|set|add|append|prepend|insert|only|replace|keep|destroy|force)\\b)',
        '(?<boolean>\\b(?:true|false)\\b)',
        '(?<property>\\b[A-Za-z_][A-Za-z0-9_]*(?=\\s*[=:]))',
        '(?<number>(?<![\\w])[~^]?-?\\d+(?:\\.\\d+)?[bdfsL]?(?![\\w])|[~^](?![\\w.-]))',
        '(?<punctuation>[{}[\\](),:=])',
    ].join('|'),
    'g'
);
const MCF_TYPES = { string: 'string', selector: 'selector', resource: 'class-name', keyword: 'keyword', boolean: 'boolean', property: 'property', number: 'number', punctuation: 'punctuation' };

function tokenizeMcfunction(code) {
    const tokens = [];
    code.split('\n').forEach((line, n) => {
        if (n > 0) tokens.push('\n');
        if (/^\s*#/.test(line)) {
            tokens.push({ type: 'comment', content: line });
            return;
        }
        const [, lead, command] = /^([ \t]*\/?)([a-z_]*)/.exec(line);
        if (lead) tokens.push(lead);
        if (command) tokens.push({ type: 'function', content: command });
        const rest = line.slice(lead.length + command.length);
        let at = 0;
        for (const m of rest.matchAll(MCF_ARGS)) {
            if (m.index > at) tokens.push(rest.slice(at, m.index));
            const kind = Object.keys(m.groups).find((k) => m.groups[k] !== undefined);
            tokens.push({ type: MCF_TYPES[kind], content: m[0] });
            at = m.index + m[0].length;
        }
        if (at < rest.length) tokens.push(rest.slice(at));
    });
    return tokens;
}

const ALIASES = { js: 'javascript', sh: 'bash', shell: 'bash', py: 'python', yml: 'yaml', mc: 'mcfunction' };
const LANGUAGES = ['mcfunction', 'json', 'javascript', 'bash', 'python', 'yaml', 'java'];

// Token type to color. Anything not listed, such as punctuation and operators, keeps the default color.
const THEME = {
    comment: 'dark_gray',
    prolog: 'dark_gray',
    string: 'dark_green',
    'template-string': 'dark_green',
    'attr-value': 'dark_green',
    char: 'dark_green',
    regex: 'dark_green',
    keyword: 'dark_purple',
    'control-flow': 'dark_purple',
    number: 'dark_red',
    boolean: 'dark_red',
    constant: 'dark_red',
    selector: 'dark_red',
    function: 'dark_blue',
    builtin: 'dark_blue',
    'class-name': 'dark_blue',
    property: 'dark_aqua',
    'attr-name': 'dark_aqua',
    variable: 'dark_aqua',
    parameter: 'dark_aqua',
    annotation: 'dark_aqua',
    key: 'dark_aqua',
    atrule: 'dark_aqua',
};

const colorOf = (token) => THEME[token.type] || (token.alias && [].concat(token.alias).map((a) => THEME[a]).find(Boolean)) || undefined;

// The token stream as flat { text, color } pieces, a nested token keeps the color of its parent unless it has its own
function flatten(tokens, inherited = undefined) {
    return tokens.flatMap((t) => {
        if (typeof t === 'string') return [{ text: t, color: inherited }];
        const color = colorOf(t) || inherited;
        return Array.isArray(t.content) ? flatten(t.content, color) : [{ text: String(t.content), color }];
    });
}

function highlight(code, language) {
    const name = ALIASES[String(language).toLowerCase()] || String(language).toLowerCase();
    if (!LANGUAGES.includes(name)) return null;
    const tokens = name === 'mcfunction' ? tokenizeMcfunction(code) : Prism.tokenize(code, Prism.languages[name]);
    const lines = [[]];
    for (const piece of flatten(tokens)) {
        piece.text.split('\n').forEach((text, n) => {
            if (n > 0) lines.push([]);
            if (text) lines[lines.length - 1].push({ text, color: piece.color });
        });
    }
    // Neighbors of one color are one piece
    return lines.map((line) => line.reduce((out, piece) => (out.length && out[out.length - 1].color === piece.color ? [...out.slice(0, -1), { text: out[out.length - 1].text + piece.text, color: piece.color }] : [...out, piece]), []));
}

module.exports = { highlight, LANGUAGES, ALIASES };
