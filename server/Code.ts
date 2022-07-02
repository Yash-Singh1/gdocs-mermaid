function onInstall() {
  onOpen();
}

function onOpen() {
  // We can't immediately show the sidebar here until some interaction is done
  // This is a feature present in Google Docs Addons for security purposes
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('New', 'newDiagram')
    .addItem('Edit Selected', 'editSelectedDiagram')
    .addSeparator()
    .addItem('Open in Sidebar', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  let html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle('Flowcast');

  DocumentApp.getUi().showSidebar(html);
}

function newDiagram() {
  let url =
    'https://mermaid.ink/img/c2VxdWVuY2VEaWFncmFtIApBbGljZS0+PitKb2huOiBIZWxsbyBKb2huLCBob3cgYXJlIHlvdT8KQWxpY2UtPj4rSm9objogSm9obiwgY2FuIHlvdSBoZWFyIG1lPwpKb2huLS0+Pi1BbGljZTogSGkgQWxpY2UsIEkgY2FuIGhlYXIgeW91IQpKb2huLS0+Pi1BbGljZTogSSBmZWVsIGdyZWF0IQoK';
  let blob = UrlFetchApp.fetch(url).getBlob();
  DocumentApp.getActiveDocument()
    .getCursor()
    .insertInlineImage(blob)
    .setLinkUrl(url);
}

function editSelectedDiagram() {
  if (ensureSelected('Select a Flowcast diagram to edit one')) {
    let selectedElement = DocumentApp.getActiveDocument()
      .getSelection()
      .getRangeElements()[0]
      .getElement();
    let htmlTemplate = HtmlService.createTemplateFromFile('dialog');
    htmlTemplate.state = Utilities.newBlob(
      Utilities.base64Decode(
        selectedElement
          .asInlineImage()
          .getLinkUrl()
          .slice('https://mermaid.ink/img/'.length),
        Utilities.Charset.UTF_8
      )
    ).getDataAsString();
    DocumentApp.getUi().showModalDialog(
      htmlTemplate.evaluate().setTitle('Flowcast'),
      'Flowcast'
    );
  }
}

function save(code) {
  if (ensureSelected('Select a Flowcast diagram to edit one')) {
    let selectedElement = DocumentApp.getActiveDocument()
      .getSelection()
      .getRangeElements()[0]
      .getElement();

    const url = `https://mermaid.ink/img/${Utilities.base64Encode(code)}`;
    const index = selectedElement.getParent().getChildIndex(selectedElement);
    let blob = UrlFetchApp.fetch(url).getBlob();
    (selectedElement.getParent() as GoogleAppsScript.Document.Paragraph)
      .insertInlineImage(index + 1, blob)
      .setLinkUrl(url);
    selectedElement.getParent().getChild(index).removeFromParent();
  }
}

function deleteDiagram() {
  if (ensureSelected('Select a Flowcast diagram to remove one')) {
    DocumentApp.getActiveDocument()
      .getSelection()
      .getRangeElements()[0]
      .getElement()
      .removeFromParent();
  }
}

function ensureSelected(actionMsg) {
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
