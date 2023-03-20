module.exports = {
    default: function (context) {
        return {
            // Forked "markdown-it-multimd-table" to support caption-side CSS:
            plugin: function(markdownIt, options) {
                markdownIt.use(require('markdown-it-multimd-table'), {
                    ...options,
                    multiline:  true,
                    rowspan:    true,
                    headerless: true,
                    multibody:  true,
                    autolabel:  true,
                });
            },
        }
    }
}