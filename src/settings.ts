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
