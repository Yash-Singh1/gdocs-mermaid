import ensureSelected from './helpers/ensureSelected';
import diagrams from './data/diagrams.json';

export function onInstall() {
  onOpen();
}

export function onOpen() {
  // We can't immediately show the sidebar here until some interaction is done
  // This is a feature present in Google Docs Addons for security purposes
  DocumentApp.getUi()
    .createAddonMenu()
    .addSubMenu(
      DocumentApp.getUi()
        .createMenu('New')
        .addItem('Blank', 'newDiagram')
        .addItem('Template', 'showTemplating')
    )
    .addItem('Edit Selected', 'editSelectedDiagram')
    .addSeparator()
    .addItem('Open in Sidebar', 'showSidebar')
    .addToUi();
}

export function showSidebar() {
  DocumentApp.getUi().showSidebar(
    HtmlService.createTemplateFromFile('sidebar')
      .evaluate()
      .setTitle('Flowcast')
  );
}

export function newDiagram(type: keyof typeof diagrams = 'blank') {
  let url = `https://mermaid.ink/img/${diagrams[type]}`;
  let blob = UrlFetchApp.fetch(url).getBlob();
  let cursor = DocumentApp.getActiveDocument().getCursor();
  if (cursor) {
    cursor.insertInlineImage(blob).setLinkUrl(url);
    return;
  }
  // TODO: Look into handling more fallbacks, e.g. no selection
  let selectedElement = DocumentApp.getActiveDocument()
    .getSelection()
    .getRangeElements()[0]
    .getElement();
  const index = selectedElement.getParent().getChildIndex(selectedElement);
  (selectedElement.getParent() as GoogleAppsScript.Document.Paragraph)
    .insertInlineImage(index + 1, blob)
    .setLinkUrl(url);
}

export function applyTemplate(type: keyof typeof diagrams) {
  if (ensureSelected('Select a Flowcast diagram to edit one')) {
    let selectedElement = DocumentApp.getActiveDocument()
      .getSelection()
      .getRangeElements()[0]
      .getElement();

    const url = `https://mermaid.ink/img/${diagrams[type]}`;
    const index = selectedElement.getParent().getChildIndex(selectedElement);
    let blob = UrlFetchApp.fetch(url).getBlob();
    (selectedElement.getParent() as GoogleAppsScript.Document.Paragraph)
      .insertInlineImage(index + 1, blob)
      .setLinkUrl(url);
    selectedElement.getParent().getChild(index).removeFromParent();
  }
}

export function editSelectedDiagram() {
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
    let evaluated = htmlTemplate.evaluate();
    DocumentApp.getUi().showModalDialog(
      evaluated
        .setWidth(1237.5)
        .setHeight(886.5)
        .setTitle('Flowcast'),
      'Flowcast'
    );
  }
}

export function save(code: string) {
  if (ensureSelected('Select a Flowcast diagram to edit one')) {
    let selectedElement = DocumentApp.getActiveDocument()
      .getSelection()
      .getRangeElements()[0]
      .getElement();

    // TODO: Support pako over here
    const url = `https://mermaid.ink/img/${Utilities.base64Encode(code)}`;
    const index = selectedElement.getParent().getChildIndex(selectedElement);
    let blob = UrlFetchApp.fetch(url).getBlob();
    (selectedElement.getParent() as GoogleAppsScript.Document.Paragraph)
      .insertInlineImage(index + 1, blob)
      .setLinkUrl(url);
    selectedElement.getParent().getChild(index).removeFromParent();
  }
}

export function showTemplating(attachTo: boolean = false) {
  let htmlTemplate = HtmlService.createTemplateFromFile('template-page');

  if (attachTo === true) {
    htmlTemplate.attachTo = 'true';
  } else {
    htmlTemplate.attachTo = 'false';
  }

  let evaluated = htmlTemplate.evaluate();
  DocumentApp.getUi().showModalDialog(
    evaluated
      .setWidth(1237.5)
      .setHeight(886.5)
      .setTitle('Flowcast Templates'),
    'Flowcast Templates'
  );
}
