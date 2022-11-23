> ⚠ This plugin is currently in development and isn't released yet.

<table>
    <tr>
        <td colspan="3" align="center">
            <h3>MultiMarkdown Table Tools</h3>
        </td>
    </tr>
    <tr>
        <td rowspan="5" align="center">
            <img src="./assets/joplin.svg" width="64"><br>
            <p>
                <strong>Joplin Plugin</strong><br>
                MultiMarkdown Table Tools
            </p>
        </td>
    </tr>
    <tr>
        <td colspan="2"><strong>A collection of tools to make editing tables easier.</strong></td>
    </tr>
    <tr>
        <td colspan="2">
            <!-- Placeholder -->
            <img style="vertical-align: bottom" src="https://img.shields.io/badge/version-1.0.0-white?style=for-the-badge">
            <img style="vertical-align: bottom" src="https://img.shields.io/badge/downloads-0-white?style=for-the-badge">
        </td>
    </tr>
    <tr>
        <td>Built with:</td>
        <td>
            <a href="https://github.com/laurent22/joplin/tree/dev/packages/generator-joplin">generator-joplin</a>,
            <a href="https://github.com/FelisDiligens/md-table-tools">md-table-tools</a>,
            <a href="https://github.com/mixmark-io/turndown">turndown</a>,
            <a href="https://github.com/redbug312/markdown-it-multimd-table">markdown-it-multimd-table</a>
        </td>
    </tr>
    <tr>
        <td>Inspired by:</td>
        <td>
            <a href="https://github.com/roman-r-m/joplin-plugin-table-formatter">Table Formatter Plugin</a>,
            <a href="https://github.com/kensam94/joplin-plugin-eztable">Ez Table</a>
            <!-- <a href="https://github.com/coderrsid/paste-special">Paste Special Plugin</a> -->
        </td>
    </tr>
</table>


## ✨ Features

- Create new tables with ease.
- Format and minify Markdown tables.
- Add, delete, and move table rows and columns.
- Align text left, center, or right.
- Jump to next or previous cell with `Tab` and `Shift` + `Tab`.
- Convert tables between HTML, Markdown, and CSV.
- Choose MultiMarkdown or GitHub Flavored Markdown table format in the settings. *(personal preference, MultiMarkdown is default)*
- Adds hotkeys, see below. *(opt-out)*
- Disable features if you don't like them *(toolbar buttons, contextmenu items, hotkeys)*.
  - This also makes this plugin compatible with other plugins that use the same hotkeys or equally named contextmenu items.
- Enable a forked version of the `markdown-it-multimd-table` extension in the settings. *(opt-in)*
  - Allows you to place table captions below a table. See [this forum post](https://discourse.joplinapp.org/t/multimarkdown-table-captions-above-table-not-below/2819).

### Hotkeys

All actions are relative to where you placed the I-beam (also called I-cursor) in the text editor:

| Hotkey                          | Action                           |
|---------------------------------|----------------------------------|
| `Tab`                           | Jump to next cell                |
| `Shift` + `Tab`                 | Jump to previous cell            |
| `Enter`                         | Insert `<br>` instead of newline |
| `Cmd` or `Ctrl` + `Enter`       | Insert row below                 |
| `Cmd` or `Ctrl` + `Tab`         | Insert column to the right       |
| `Cmd` or `Ctrl` + `Shift` + `F` | Format current table             |

All of these actions can also be performed from the menu (e.g. Tools → Table tools → Row -> Insert below).

## 📸 Screenshots

> TODO

## ⚙️ Installation

### From the repo (recommended)

- Go to the settings (Tools → Options) → Plugins
- Search for `MultiMarkdown Table Tools`
- Click 'Install' and restart Joplin
- Enjoy

### Manually

- Download the *.jpl file from the [releases](https://github.com/FelisDiligens/joplin-plugin-cmoptions/releases) section
- Go to the settings (Tools → Options) → Plugins
- Click the gear next to 'Manage your plugins' and choose 'Install from file'
- Select the downloaded *.jpl file
- Enjoy

## ⚡ Usage

> TODO

## 🐛 Known issues

### Broken dialogs

![](assets/broken-dialog.png)

<details>
<summary><em>(Click to see how it's supposed to look like...)</em></summary>

![](assets/working-dialog.png)

</details>

Every now and then the plugin swallows up its dialogs. There doesn't seem to be anything I can do to fix this.  
If that happens to you, click "Cancel" and try again.

Also, if this happens all the time, you can enable these (working) dialogs in the advanced settings and they'll show up whenever feasible:

![](assets/native-dialog.png)

### Only every second table gets formatted

It could be that only every second table gets formatted, when you click `Format all tables`.  
If that happens to you, click `Format all tables` twice or format each table with `Format table`.

<!--
## ☕ I can haz coffee?

![](./assets/i-can-haz-cheezburger.jpg)

If you like this plugin, consider to support me on ☕ ko-fi:

[![](assets/buy-me-a-coffee.png)](https://ko-fi.com/felisdiligens)
 -->
## Development

<details>
<summary>Text from "generator-joplin"</summary>

This is a template to create a new Joplin plugin.

The main two files you will want to look at are:

- `/src/index.ts`, which contains the entry point for the plugin source code.
- `/src/manifest.json`, which is the plugin manifest. It contains information such as the plugin a name, version, etc.

## Building the plugin

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can use to distribute the plugin.

To build the plugin, simply run `npm run dist`.

The project is setup to use TypeScript, although you can change the configuration to use plain JavaScript.

## Updating the plugin framework

To update the plugin framework, run `npm run update`.

In general this command tries to do the right thing - in particular it's going to merge the changes in package.json and .gitignore instead of overwriting. It will also leave "/src" as well as README.md untouched.

The file that may cause problem is "webpack.config.js" because it's going to be overwritten. For that reason, if you want to change it, consider creating a separate JavaScript file and include it in webpack.config.js. That way, when you update, you only have to restore the line that include your file.

</details>
