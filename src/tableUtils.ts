import { MultiMarkdownTableParser, MinifiedMultiMarkdownTableRenderer, PrettyMultiMarkdownTableRenderer, TableParser, TableRenderer, GitHubFlavoredMarkdownTableParser, GitHubFlavoredMarkdownTableRenderer, HTMLTableParser, HTMLTableRenderer } from 'md-table-tools';

const multimdParser = new MultiMarkdownTableParser();
const multimdMinifiedRenderer = new MinifiedMultiMarkdownTableRenderer();
const multimdPrettyRenderer = new PrettyMultiMarkdownTableRenderer();

const gfmParser = new GitHubFlavoredMarkdownTableParser();
const gfmMinifiedRenderer = new GitHubFlavoredMarkdownTableRenderer(false);
const gfmPrettyRenderer = new GitHubFlavoredMarkdownTableRenderer(true);

const htmlParser = new HTMLTableParser();
const htmlRenderer = new HTMLTableRenderer();

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