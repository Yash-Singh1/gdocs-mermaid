/* What should the add-on do after it is installed */
function onInstall() {
  onOpen();
}

function onOpen() {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Flowcast', 'showSidebar')
    .addToUi();
}

/* Show a 300px sidebar with the HTML from googlemaps.html */
function showSidebar() {
  var html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle('Flowcast'); // The title shows in the sidebar

  DocumentApp.getUi().showSidebar(html);
  DocumentApp.getUi()
    .createMenu('Flocast')
    .addItem('New', 'menuItem1')
    .addItem('Generate', 'menuItem2')
    .addSeparator()
    .addSubMenu(
      DocumentApp.getUi().createMenu('Edit').addItem('Second item', 'menuItem3')
    )
    .addToUi(); // Run the showSidebar function when someone clicks the menu
}

function menuItem1() {
  console.log('new');
}

function menuItem2() {
  console.log('generate');
}

function menuItem3() {
  console.log('Another menu item testing seperator and submenus');
}
