import joplin from 'api';
import { SettingItemType } from 'api/types';

/**
 * Returns all settings the user can/has set.
*/
export async function getSettings() {
	return {
		"selectedFormat": await joplin.settings.value('tableToolsSelectedFormat'),
		"useMarkdownItExtension": await joplin.settings.value('tableToolsUseMarkdownItExtension'),
		"useNativeDialogs": await joplin.settings.value('tableToolsDebugUseNativeDialogs'),
		"allowAddToToolbar": await joplin.settings.value('tableToolsAddButtonsToToolbar'),
		"allowAddToContextMenu": await joplin.settings.value('tableToolsAddCommandsToContextMenu'),
		"allowHotkeys": await joplin.settings.value('tableToolsAllowHotkeys'),
		"tabBehavior": await joplin.settings.value('tableToolsTabBehavior'),
		"formatOnTab": await joplin.settings.value('tableToolsFormatOnTab'),
		"enterBehavior": await joplin.settings.value('tableToolsEnterBehavior'),
	}
}

/**
 * Register this plugin's settings to Joplin.
 */
export async function registerAllSettings() {
	const section = 'MultiMarkdownTableToolsSettings';

	await joplin.settings.registerSection(section, {
		label: 'MultiMarkdown Table Tools',
		description: 'You can configure the behavior of the "MultiMarkdown Table Tools" plugin here. ⚠ You may need to restart Joplin for some of these settings to take effect.',
		iconName: 'fas fa-table'
	});

	await joplin.settings.registerSettings({
		['tableToolsSelectedFormat']: { 
			public: true,
			section: section,
			type: SettingItemType.String,
			isEnum: true,
			value: 'multimd',
			label: 'Table format',
			description: 'If you don\'t care about MultiMarkdown, you can enable/disable MultiMarkdown table support here.',
			options: {
				'multimd': 'MultiMarkdown (default)',
				'gfm': 'GitHub Flavored Markdown'
			},
		},
		['tableToolsAddButtonsToToolbar']: {
			public: true,
			section: section,
			type: SettingItemType.Bool,
			value: true,
			label: 'Add buttons to toolbar',
		},
		['tableToolsAddCommandsToContextMenu']: {
			public: true,
			section: section,
			type: SettingItemType.Bool,
			value: true,
			label: 'Add options to contextmenu',
		},
		['tableToolsAllowHotkeys']: {
			public: true,
			section: section,
			type: SettingItemType.Bool,
			value: true,
			label: 'Enable hotkeys',
		},
		['tableToolsTabBehavior']: { 
			public: true,
			section: section,
			type: SettingItemType.String,
			isEnum: true,
			value: 'selectContent',
			label: "'Tab' behavior",
			description: 'Where do you want to place the cursor when pressing Tab or Shift+Tab inside a table?',
			options: {
				'jumpToStart': 'Jump to the start of the cell',
				'jumpToEnd': 'Jump to the end of the cell',
				'selectContent': 'Select the contents of the cell', // This is the same behavior that Microsoft Word (and Excel) exhibits.
				'disabled': 'Insert tab (Disable this hotkey)',
			},
		},
		['tableToolsFormatOnTab']: {
			public: true,
			section: section,
			type: SettingItemType.Bool,
			value: true,
			label: "Format table on 'Tab'",
		},
		['tableToolsEnterBehavior']: { 
			public: true,
			section: section,
			type: SettingItemType.String,
			isEnum: true,
			value: 'insertBrTag',
			label: "'Enter' behavior",
			description: 'What should happen when you press Enter inside a table?',
			options: {
				'insertBrTag': 'Insert <br> tag',
				//'addRowBelow': 'Add new row below',
				'disabled': 'Insert newline (Disable this hotkey)',
			},
		},
		['tableToolsUseMarkdownItExtension']: {
			public: true,
			section: section,
			type: SettingItemType.Bool,
			value: false,
			label: 'Use forked MultiMarkdown table extension',
			description: 'Forked from "markdown-it-multimd-table" version 4.2.0 by redbug312. The fork adds caption-side CSS. ⚠ Please disable the built-in MultiMarkdown table extension before enabling this.',
		},
		['tableToolsDebugUseNativeDialogs']: {
			advanced: true,
			public: true,
			section: section,
			type: SettingItemType.Bool,
			value: false,
			label: 'Use native dialogs when possible',
			description: 'If you experience issues with Joplin\'s dialogs (= not displaying text), enable this option to use native dialogs instead. (Not always applicable)',
		},
	});
}
