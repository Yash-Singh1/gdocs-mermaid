import ensureSelected from './helpers/ensureSelected';
import * as diagrams from './data/diagrams.json';
import deserialize from './helpers/deserialize';
import serialize from './helpers/serialize';

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
    .addItem('Tell Dimensions', 'tellDims')
    .addToUi();
}

export function showSidebar() {
  DocumentApp.getUi().showSidebar(
    HtmlService.createTemplateFromFile('sidebar')
      .evaluate()
      .setTitle('Flowcast')
  );
}

export function newDiagram(
  type: typeof unique extends true ? Template : keyof typeof diagrams = 'blank',
  unique: boolean
) {
  let width;
  let height;
  let url = `https://mermaid-res.fly.dev/img/${
    unique
      ? serialize(
          JSON.stringify({
            mermaid: (type as unknown as Template).mermaid,
            code: deserialize((type as unknown as Template).code),
          }),
          'pako'
        )
      : serialize(
          JSON.stringify({
            ...diagrams[type],
            width: undefined,
            height: undefined,
          }),
          'pako'
        )
  }`;
  if (!unique) {
    width = diagrams[type].width || null;
    height = diagrams[type].height || null;
  } else {
    width = (type as unknown as Template).width || null;
    height = (type as unknown as Template).height || null;
  }
  let blob = UrlFetchApp.fetch(url).getBlob();
  let cursor = DocumentApp.getActiveDocument().getCursor();
  if (cursor) {
    let newImage = cursor.insertInlineImage(blob);
    newImage.setLinkUrl(url);
    if (width) {
      newImage.setWidth(width);
    }
    if (height) {
      newImage.setHeight(height);
    }
    return;
  }
  // TODO: Look into handling more fallbacks, e.g. no selection
  let selectedElement = DocumentApp.getActiveDocument()
    .getSelection()
    .getRangeElements()[0]
    .getElement();
  const index = selectedElement.getParent().getChildIndex(selectedElement);

  let newImage = (
    selectedElement.getParent() as GoogleAppsScript.Document.Paragraph
  ).insertInlineImage(index + 1, blob);
  newImage.setLinkUrl(url);
  if (width) {
    newImage.setWidth(width);
  }
  if (height) {
    newImage.setHeight(height);
  }
}

export function applyTemplate(
  type: typeof unique extends true ? Template : keyof typeof diagrams,
  unique: boolean
) {
  if (ensureSelected('Select a Flowcast diagram to edit one')) {
    let selectedElement = DocumentApp.getActiveDocument()
      .getSelection()
      .getRangeElements()[0]
      .getElement();

    const url = `https://mermaid-res.fly.dev/img/${
      unique
        ? serialize(
            JSON.stringify({
              mermaid: (type as unknown as Template).mermaid,
              code: deserialize((type as unknown as Template).code),
            }),
            'pako'
          )
        : serialize(
            JSON.stringify({
              ...diagrams[type],
              width: undefined,
              height: undefined,
            }),
            'pako'
          )
    }`;

    let width =
      (unique ? (type as unknown as Template).width : diagrams[type].width) ||
      null;
    let height =
      (unique ? (type as unknown as Template).height : diagrams[type].height) ||
      null;

    const index = selectedElement.getParent().getChildIndex(selectedElement);
    let blob = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getBlob();
    let newImage = (
      selectedElement.getParent() as GoogleAppsScript.Document.Paragraph
    )
      .insertInlineImage(index + 1, blob)
      .setLinkUrl(url);
    if (width) {
      newImage.setWidth(width);
    }
    if (height) {
      newImage.setHeight(height);
    }
    selectedElement.getParent().getChild(index).removeFromParent();
  }
}

export function tellDims() {
  let selectedElement = DocumentApp.getActiveDocument()
    .getSelection()
    .getRangeElements()[0]
    .getElement()
    .asInlineImage();
  let width = selectedElement.getWidth();
  let height = selectedElement.getHeight();
  DocumentApp.getUi().alert(`Width: ${width}, Height: ${height}`);
}

export function editSelectedDiagram() {
  if (ensureSelected('Select a Flowcast diagram to edit one')) {
    let selectedElement = DocumentApp.getActiveDocument()
      .getSelection()
      .getRangeElements()[0]
      .getElement();
    let htmlTemplate = HtmlService.createTemplateFromFile('dialog');
    htmlTemplate.state = deserialize(
      selectedElement
        .asInlineImage()
        .getLinkUrl()
        .slice('https://mermaid-res.fly.dev/img/'.length)
    );
    let evaluated = htmlTemplate.evaluate();
    DocumentApp.getUi().showModalDialog(
      evaluated.setWidth(1237.5).setHeight(886.5).setTitle('Flowcast'),
      'Flowcast'
    );
  }
}

export function save(code: string, [width, height]: [number, number]) {
  if (ensureSelected('Select a Flowcast diagram to edit one')) {
    let selectedElement = DocumentApp.getActiveDocument()
      .getSelection()
      .getRangeElements()[0]
      .getElement();

    const url = `https://mermaid-res.fly.dev/img/${serialize(code, 'pako')}`;

    const index = selectedElement.getParent().getChildIndex(selectedElement);
    let blob = UrlFetchApp.fetch(url).getBlob();
    (selectedElement.getParent() as GoogleAppsScript.Document.Paragraph)
      .insertInlineImage(index + 1, blob)
      .setLinkUrl(url)
      .setWidth(width)
      .setHeight(height);
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

  htmlTemplate.templates = Object.entries(
    PropertiesService.getUserProperties().getProperties()
  )
    .map((entry) => {
      return Utilities.base64Encode(
        JSON.stringify({
          name: entry[0],
          ...JSON.parse(
            Utilities.newBlob(
              Utilities.base64Decode(entry[1])
            ).getDataAsString()
          ),
        })
      );
    })
    .join(',');

  let evaluated = htmlTemplate.evaluate();
  DocumentApp.getUi().showModalDialog(
    evaluated.setWidth(1237.5).setHeight(886.5).setTitle('Flowcast Templates'),
    'Flowcast Templates'
  );
}

interface Template {
  name: string;
  description: string;
  code: string;
  mermaid: any;
  width: number;
  height: number;
}

export function createPersonalTemplate(template: Template) {
  PropertiesService.getUserProperties().setProperty(
    template.name,
    Utilities.base64Encode(
      JSON.stringify({
        ...template,
        name: undefined,
      })
    )
  );
}

export function deleteTemplate(templateName: string) {
  PropertiesService.getUserProperties().deleteProperty(templateName);
}
