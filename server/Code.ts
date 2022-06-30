function onInstall() {
  onOpen();
}

function onOpen() {
  showSidebar();
}

function showSidebar() {
  var html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle('Flowcast');

  DocumentApp.getUi().showSidebar(html);
  DocumentApp.getUi()
    .createMenu('Flowcast')
    .addItem('New', 'newDiagram')
    .addItem('Edit Selected', 'editSelectedDiagram')
    .addSeparator()
    .addItem('Restart Addon', 'showSidebar')
    .addToUi();
}

function newDiagram() {
  console.log('new');
}

function editSelectedDiagram() {
  console.log('generate');
}
