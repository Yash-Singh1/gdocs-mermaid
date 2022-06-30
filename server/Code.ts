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
  var html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle('Flowcast');

  DocumentApp.getUi().showSidebar(html);
}

function newDiagram() {
  var url =
    'https://mermaid.ink/img/c2VxdWVuY2VEaWFncmFtIApBbGljZS0+PitKb2huOiBIZWxsbyBKb2huLCBob3cgYXJlIHlvdT8KQWxpY2UtPj4rSm9objogSm9obiwgY2FuIHlvdSBoZWFyIG1lPwpKb2huLS0+Pi1BbGljZTogSGkgQWxpY2UsIEkgY2FuIGhlYXIgeW91IQpKb2huLS0+Pi1BbGljZTogSSBmZWVsIGdyZWF0IQoK';
  var blob = UrlFetchApp.fetch(url).getBlob();
  DocumentApp.getActiveDocument().getCursor().insertInlineImage(blob);
}

function editSelectedDiagram() {
  var selectedElement = DocumentApp.getActiveDocument()
    .getSelection()
    .getRangeElements()[0]
    .getElement();
}
