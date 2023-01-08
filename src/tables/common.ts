import TurndownService from "turndown";
//import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown';

export function removeInvisibleCharacters(str: string): string {
    // See: https://www.utf8-chartable.de/unicode-utf8-table.pl
    //      https://stackoverflow.com/a/13836410
    // /[^\u0000-\u007E]/g
    // /\u00AD/g - soft hyphen
    // /[^\u0020-\u007E\u00A1-\u00AC\u00AE-\u00FF]/g
    return str
        .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "") // Control characters
        .replace(/[\u00AD\u2007\u200C\u2028-\u202F\u2060-\u206F\uFEFF]/g, "") // Invisible characters, such as &shy; or "Zero Width Non-Joiner"
        .replace(/\u00A0/g, "&nbsp;")
        .replace(/\u2002/g, "&ensp;")
        .replace(/\u2003/g, "&emsp;")
        .replace(/\u2009/g, "&thinsp;")
    //.replace(/[\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EE\u05F5-\u05FF\u070E\u074B\u074C\u07B2-\u07BF\u07FB\u07FC\u082E\u082F\u083F]/g, ""); // Weird characters
}

/** Returns a TurndownService object configured for my own taste... deal with it 😎
 * (nah, jk, if you don't like it, you can configure it to fit your needs) */
export function getTurndownService(): TurndownService {
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        fence: '```',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined',
        linkReferenceStyle: 'full'
    });

    // Add strikethrough:
    turndownService.addRule('strikethrough', {
        filter: ['del', 's'], // , 'strike'
        replacement: function (content) {
            return '~~' + content + '~~';
        }
    });

    // Add blockquote:
    /*turndownService.addRule('blockquote', {
        filter: ['blockquote'],
        replacement: function (content) {
            return '> ' + content;
        }
    });*/

    // Filter table tags:
    turndownService
        .remove('table')
        .remove('tbody')
        .remove('thead')
        .remove('tr')
        .remove('td')
        .remove('th');

    return turndownService;
}

/*export function getNodeHtmlMarkdown(): NodeHtmlMarkdown {
    return new NodeHtmlMarkdown(
        {
            bulletMarker: '-',
            emDelimiter: '*',
            strongDelimiter: '**',
            ignore: ['table', 'tbody', 'thead', 'tr', 'td', 'th']
        }
    );
}*/