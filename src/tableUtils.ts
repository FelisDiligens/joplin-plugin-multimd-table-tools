import { MultiMarkdownTableParser, MinifiedMultiMarkdownTableRenderer, PrettyMultiMarkdownTableRenderer, TableParser, TableRenderer, GitHubFlavoredMarkdownTableParser, GitHubFlavoredMarkdownTableRenderer, HTMLTableParser, HTMLTableRenderer, CSVTableParser, CSVTableRenderer, Table } from 'md-table-tools';

const multimdParser = new MultiMarkdownTableParser();
const multimdMinifiedRenderer = new MinifiedMultiMarkdownTableRenderer();
const multimdPrettyRenderer = new PrettyMultiMarkdownTableRenderer();

const gfmParser = new GitHubFlavoredMarkdownTableParser();
const gfmMinifiedRenderer = new GitHubFlavoredMarkdownTableRenderer(false);
const gfmPrettyRenderer = new GitHubFlavoredMarkdownTableRenderer(true);

const htmlParser = new HTMLTableParser();
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
    else if (table.match(separatorRegex))
        return getMarkdownParser(format).parse(table);
    // At least one comma found?
    else if (table.match(/(.*,)+.*/))
        return csvParser.parse(table);
    return null;
}