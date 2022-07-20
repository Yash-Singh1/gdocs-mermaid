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
        .addItem('Template', 'showTemplates')
    )
    .addItem('Edit Selected', 'editSelectedDiagram')
    .addSeparator()
    .addItem('Open in Sidebar', 'showSidebar')
    .addToUi();
}

export function showTemplates() {
  showSidebar(true);
}

export function showSidebar(template: boolean = false) {
  let html = HtmlService.createTemplateFromFile('sidebar');

  if (template) {
    html.template = 'true';
  } else {
    html.template = 'false';
  }

  DocumentApp.getUi().showSidebar(html.evaluate().setTitle('Flowcast'));
}

export function newDiagram(type: keyof typeof diagrams = 'blank') {
  let url = `https://mermaid.ink/img/${diagrams[type]}`;
  let blob = UrlFetchApp.fetch(url).getBlob();
  let cursor = DocumentApp.getActiveDocument().getCursor();
  if (cursor) {
    cursor.insertInlineImage(blob).setLinkUrl(url);
    return;
  }
  let selectedElement = DocumentApp.getActiveDocument()
    .getSelection()
    .getRangeElements()[0]
    .getElement();
  const index = selectedElement.getParent().getChildIndex(selectedElement);
  (selectedElement.getParent() as GoogleAppsScript.Document.Paragraph)
    .insertInlineImage(index + 1, blob)
    .setLinkUrl(url);
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
        .setWidth(evaluated.getWidth() * 2.25)
        .setHeight(evaluated.getHeight() * 2.25)
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

export function voiceType() {
  // let htmlTemplate = HtmlService.createTemplateFromFile('voice-type');
  // DocumentApp.getUi().showModelessDialog(
  //   htmlTemplate
  //     .evaluate()
  //     .setWidth(96)
  //     .setHeight(128)
  //     .setTitle('Voice Type'),
  //   'Voice Type'
  // );
}
