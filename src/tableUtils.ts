import {
    CSVTableParser,
    CSVTableRenderer,
    GitHubFlavoredMarkdownTableParser,
    GitHubFlavoredMarkdownTableRenderer,
    HTMLTableParser,
    HTMLTableParserMode,
    HTMLTableRenderer,
    MinifiedMultiMarkdownTableRenderer,
    MultiMarkdownTableParser,
    PrettyMultiMarkdownTableRenderer,
    Table,
    TableParser,
    TableRenderer,
} from "@felisdiligens/md-table-tools";
import TurndownService from "turndown";

const multimdParser = new MultiMarkdownTableParser();
const multimdMinifiedRenderer = new MinifiedMultiMarkdownTableRenderer();
const multimdPrettyRenderer = new PrettyMultiMarkdownTableRenderer();

const gfmParser = new GitHubFlavoredMarkdownTableParser();
const gfmMinifiedRenderer = new GitHubFlavoredMarkdownTableRenderer(false);
const gfmPrettyRenderer = new GitHubFlavoredMarkdownTableRenderer(true);

// Copied from "node_modules/@felisdiligens/md-table-tools/src/tables/common.ts":
// (see comment below for context)
/**
 * Returns a TurndownService object configured for my own taste...
 * (of course, if you don't like it, you can configure it to fit your needs)
 */
export function getTurndownService(): TurndownService {
    const turndownService = new TurndownService({
        headingStyle: "atx",
        hr: "---",
        bulletListMarker: "-",
        codeBlockStyle: "fenced",
        fence: "```",
        emDelimiter: "*",
        strongDelimiter: "**",
        linkStyle: "inlined",
        linkReferenceStyle: "full",
    });

    // Add strikethrough:
    turndownService.addRule("strikethrough", {
        filter: ["del", "s"], // , 'strike'
        replacement: function (content) {
            return "~~" + content + "~~";
        },
    });

    // Filter table tags:
    turndownService
        .remove("table")
        .remove("tbody")
        .remove("thead")
        .remove("tr")
        .remove("td")
        .remove("th");

    return turndownService;
}

/*
    I had to debug this for so long...
    For whatever reason, Webpack breaks the "getTurndownService()" function from "md-table-tools".
    It just throws this error:

    TypeError: a is not a constructor
      at file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:656556
      at new t.HTMLTableParser (file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:656922)
      at 3404 (file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:631424)
      at __webpack_require__(file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:816418)
      at 5049 (file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:611715)
      at __webpack_require__(file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:816418)
      at 3607 (file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:626211)
      at __webpack_require__(file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:816418)
      at file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:816911
      at file:///home/[redacted]/.config/joplin-desktop/tmp/plugin_joplin.plugin.MultiMarkdownTableTools.js:2:816938

    It seems the instantiation in the line "const turndownService = new TurndownService({...});" in particular is broken.
    As a workaround, I pass my own TurndownService object to the HTMLTableParser constructor. This seems to fix it.
    Just... why?
*/
// const htmlParser = new HTMLTableParser();
const htmlParser = new HTMLTableParser(HTMLTableParserMode.ConvertHTMLElements, getTurndownService());
const htmlRenderer = new HTMLTableRenderer();

const csvParser = new CSVTableParser();
const csvRenderer = new CSVTableRenderer();

const separatorRegex = /\|?([\s\.]*:?[\-=\.]+[:\+]?[\s\.]*\|?)+\|?/;

export function getMarkdownParser(format: string): TableParser {
    switch (format) {
        case "gfm":
            return gfmParser;
        case "multimd":
        default:
            return multimdParser;
    }
}

export function getMarkdownRenderer(format: string, pretty: boolean): TableRenderer {
    switch (format) {
        case "gfm":
            return pretty ? gfmPrettyRenderer : gfmMinifiedRenderer;
        case "multimd":
        default:
            return pretty ? multimdPrettyRenderer : multimdMinifiedRenderer;
    }
}

export function getHTMLParser(): HTMLTableParser {
    return htmlParser;
}

export function getHTMLRenderer(): HTMLTableRenderer {
    return htmlRenderer;
}

export function getCSVParser(): CSVTableParser {
    return csvParser;
}

export function getCSVRenderer(): CSVTableRenderer {
    return csvRenderer;
}

/** Tries to guess the format of the given table and parse it. Might throw error. Returns null, if format couldn't be guessed. */
export function parseTable(table: string, format: string): Table {
    // <table></table> tags found?
    if (table.match(/<\s*[tT][aA][bB][lL][eE].*\s*>/) && table.match(/<\/\s*[tT][aA][bB][lL][eE]\s*>/))
        return htmlParser.parse(table);
    // Markdown separator row found?
    else if (table.match(/^\|?([\s\.]*:?(?=([\-=\.]+))\2[:\+]?[\s\.]*\|?)+\|?$/m))
        return getMarkdownParser(format).parse(table);
    // At least one comma found?
    else if (table.match(/(.*,)+.*/))
        return csvParser.parse(table);
    return null;
}
