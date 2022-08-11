import { RangeSet, StateEffect, StateField } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  gutterLineClass,
  GutterMarker,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { EditorView } from 'codemirror';

const baseTheme = EditorView.baseTheme({
  '.cm-active-shown-line, .cm-active-shown-gutter': {
    backgroundColor: '#e3fff3',
  },
});

export const activeShownLineEffect = StateEffect.define<number | null>();
const activeShownLineMark = Decoration.line({
  class: 'cm-active-shown-line',
});

export const activeShownLineField = StateField.define<number | null>({
  create() {
    return null;
  },
  update(currentState, transaction) {
    for (let e of transaction.effects) {
      if (e.is(activeShownLineEffect)) {
        currentState = e.value;
      }
    }
    return currentState;
  },
});

const activeShownLineView = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.getDeco(view);
    }

    update(update: ViewUpdate) {
      for (const tr of update.transactions) {
        for (const e of tr.effects) {
          if (e.is(activeShownLineEffect)) {
            this.decorations = this.getDeco(update.view);
            return;
          }
        }
      }
    }

    getDeco(view: EditorView) {
      let stateValue = view.state.field(activeShownLineField, false);
      if (!stateValue) {
        return Decoration.none;
      }
      return Decoration.set(
        activeShownLineMark.range(view.state.doc.line(stateValue!).from)
      );
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

const activeLineGutterMarker = new (class extends GutterMarker {
  elementClass = 'cm-active-shown-gutter';
})();

const activeLineGutterHighlighter = gutterLineClass.compute(
  [activeShownLineField],
  (state) => {
    const stateValue = state.field(activeShownLineField, false);
    debugger;
    if (!stateValue) {
      return RangeSet.of([]);
    }
    return RangeSet.of([
      activeLineGutterMarker.range(state.doc.line(stateValue!).from),
    ]);
  }
);

function activeShownLine() {
  return [
    baseTheme,
    activeShownLineField,
    activeShownLineView,
    activeLineGutterHighlighter,
  ];
}

export default activeShownLine;
