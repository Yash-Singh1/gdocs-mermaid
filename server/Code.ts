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
  DocumentApp.getActiveDocument().getBody().appendImage(blob).setLinkUrl(url);
}

function editSelectedDiagram() {
  let selectedElement = DocumentApp.getActiveDocument()
    .getSelection()
    .getRangeElements()[0]
    .getElement();
  if (
    selectedElement.getType() === DocumentApp.ElementType.INLINE_IMAGE &&
    selectedElement
      .asInlineImage()
      .getLinkUrl()
      .startsWith('https://mermaid.ink/img/')
  ) {
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
  } else {
    const ui = DocumentApp.getUi();
    ui.alert('Select a Flowcast diagram to edit one', ui.ButtonSet.OK);
  }
}

function save(code) {
  let selectedElement = DocumentApp.getActiveDocument()
    .getSelection()
    .getRangeElements()[0]
    .getElement();

  if (
    selectedElement.getType() !== DocumentApp.ElementType.INLINE_IMAGE ||
    !selectedElement
      .asInlineImage()
      .getLinkUrl()
      .startsWith('https://mermaid.ink/img/')
  ) {
    throw new Error('Select a Flowcast diagram to save edits on one');
  }

  const index = selectedElement.getParent().getChildIndex(selectedElement);
  const url = `https://mermaid.ink/img/${Utilities.base64Encode(code)}`;
  let blob = UrlFetchApp.fetch(url).getBlob();
  // TODO: look into using getChildIndex for other parents than body
  (selectedElement.getParent() as GoogleAppsScript.Document.Paragraph)
    .insertInlineImage(index + 1, blob)
    .setLinkUrl(url);
  selectedElement.getParent().getChild(index).removeFromParent();
}
