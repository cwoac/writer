var writer = (function ()
{
  // private variable declarations here
  var cursorLeft;
  var cursorTop;

  // handy pointer to canvas element
  var canvas;

  function logFeature( msg )
  {
    var ol = document.getElementById("features");
    var li = document.createElement("li");
    li.innerHTML = msg;
    ol.appendChild(li);
  }

  function testForFeatures()
  {
    if( Modernizr.canvas ) logFeature("canvas"); else logFeature("no canvas");
    if( Modernizr.canvastext ) logFeature("canvas text"); else logFeature("no canvas text");
    if( Modernizr.indexeddb ) logFeature("indexeddb"); else logFeature("no indexeddb");
  }

  // publicly exposed stuff
  var pub = {};

  pub.initialiseWriter = function()
  {
    testForFeatures();
    canvas = document.getElementById("theCanvas");
    canvas.width = document.width - 10;
    canvas.height = document.height - 10;
  }

  return pub;
}());