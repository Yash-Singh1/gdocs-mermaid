export default function ensureSelected(actionMsg) {
  const ui = DocumentApp.getUi();
  let selectedElement = DocumentApp.getActiveDocument().getSelection();
  if (!selectedElement) {
    ui.alert(actionMsg, ui.ButtonSet.OK);
    return false;
  }
  if (selectedElement.getRangeElements().length > 1) {
    ui.alert('Please select a single Flowcast diagram', ui.ButtonSet.OK);
    return false;
  }
  let diagramElement = selectedElement.getRangeElements()[0].getElement();
  if (
    diagramElement.getType() !== DocumentApp.ElementType.INLINE_IMAGE ||
    !diagramElement
      .asInlineImage()
      .getLinkUrl()
      .startsWith('https://mermaid.ink/img/')
  ) {
    const ui = DocumentApp.getUi();
    ui.alert(actionMsg, ui.ButtonSet.OK);
    return false;
  }
  return true;
}
