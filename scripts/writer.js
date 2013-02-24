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
    return Modernizr.canvas && Modernizr.canvastext && Modernizr.indexeddb;
  }



  function recalcCursor()
  {
  }

  // publicly exposed stuff
  var pub = {};

  pub.listMissingFeatures = function()
  {
    if( !Modernizr.canvas ) logFeature( "No canvas.");
    if( !Modernizr.canvastext ) logFeature( "No canvas text.");
    if( !Modernizr.indexeddb ) logFeature( "No indexeddb.");
  }

  pub.resize = function()
  {
    canvas = document.getElementById("theCanvas");
    canvas.width = window.innerWidth - 10;
    canvas.height = window.innerHeight - 10;    
  }

  pub.initialise = function()
  {
    if( !testForFeatures() ) window.location = "missing_features.html";
    pub.resize();
  }

  return pub;
}());