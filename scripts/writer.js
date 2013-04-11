var writer = (function ()
{
  // private variable declarations here
  var cursorLeft;
  var cursorTop;

  // handy pointer to canvas element
  var canvas;
  // also handy pointer to the canvas' context
  var context;

  var boxes = [];

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

  function selectNone()
  {
    boxes.forEach( function(entry){ entry.c="#000000"; });
  }

  function addBox( e )
  {
    var box = {};
    box.x = e.offsetX-25;
    box.y = e.offsetY-25;
    box.w = 50;
    box.h = 50;
    box.c = "#000000";
    boxes.push( box );
  }

  function dblClickHandler(e)
  {
    addBox( e );
    pub.redraw();
  }

  function clickHandler(e) 
  {
    var box = null;
    // loop in reverse order to depth sort
    for( var i=boxes.length-1; i>=0; i-- )
    {
      if(    e.offsetX>boxes[i].x
          && e.offsetX<boxes[i].x+boxes[i].w
          && e.offsetY>boxes[i].y
          && e.offsetY<boxes[i].y+boxes[i].h)
      {
        box = boxes[i];
        box.c = "#ff0000";
        break;
      }
    }

    if( !box )
    {
      selectNone();
    }

    pub.redraw();
  }

  function drawBox( box )
  {
    context.strokeStyle = box.c;
    context.strokeRect( box.x, box.y, box.w, box.h );
  }

  // publicly exposed stuff
  var pub = {};

  // Call this whenever the screen is dirty
  pub.redraw = function()
  {
    // reset the contents of the canvas
    canvas.width = canvas.width;
    boxes.forEach(drawBox);
  }

  pub.listMissingFeatures = function()
  {
    if( !Modernizr.canvas ) logFeature( "No canvas.");
    if( !Modernizr.canvastext ) logFeature( "No canvas text.");
    if( !Modernizr.indexeddb ) logFeature( "No indexeddb.");
  }

  pub.resize = function()
  {
    canvas.width = window.innerWidth - 10;
    canvas.height = window.innerHeight - 10;    
    pub.redraw();
  }

  pub.initialise = function()
  {
    if( !testForFeatures() ) window.location = "missing_features.html";
    canvas = document.getElementById("theCanvas");
    context = canvas.getContext("2d");
    canvas.addEventListener("click",clickHandler,false);
    canvas.addEventListener("dblclick",dblClickHandler,false);
    pub.resize();
  }

  return pub;
}());