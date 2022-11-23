module.exports = {
    default: function (context) {
        return {
            // Forked "markdown-it-multimd-table" to support caption-side CSS:
            plugin: require('markdown-it-multimd-table'),
        }
    }
}