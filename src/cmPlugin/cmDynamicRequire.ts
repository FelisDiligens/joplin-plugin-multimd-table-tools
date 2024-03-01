/**
 * Imports for `@codemirror/` packages can fail when Joplin's CodeMirror 5 editor is open.
 * Because we want to support both CodeMirror 5 and CodeMirror 6, we require the CM6 packages
 * dynamically, and only when CM6 is available.
 */

import type * as CodeMirrorStateType from '@codemirror/state';
import type * as CodeMirrorViewType from '@codemirror/view';

export function requireCodeMirrorState() {
    return require('@codemirror/state') as typeof CodeMirrorStateType;
}

export function requireCodeMirrorView() {
    return require('@codemirror/view') as typeof CodeMirrorViewType;
}
