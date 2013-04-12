var writer = (function ()
{
  // private variable declarations here

  // handy pointer to canvas element
  var canvas;
  // also handy pointer to the canvas' context
  var context;

  // for dragging
  var dragOffsetX;
  var dragOffsetY;
  
  // need to deduce which events are which.
  var mouseDownTime=0;
  var mouseUpTime=0;
  var mouseIsDrag=false;
  var clickBoxState=false;
  var clickBox=null;

  var boxes = [];
  var selectList = [];

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

  function addBox( e )
  {
    var box = {};
    box.x = e.offsetX-25;
    box.y = e.offsetY-25;
    box.w = 50;
    box.h = 50;
    box.selected = false;
    boxes.push( box );
  }

  function selectNone()
  {
    boxes.forEach( function(entry){ entry.selected=false; });
    selectList = [];
  }

  function selectBox( box )
  {
    // if the box is already selected, do nothin
    if( selectList.indexOf(box) == -1 )
    {
      box.selected = true;
      selectList.push(box);
    }
  }

  function selectOnlyBox( box )
  {
    selectNone();
    selectBox(box);
  }

  function deselectBox( box )
  {
    // if the box is already unselected, do nothing
    if( selectList.indexOf(box) > -1 )
    {
      box.selected = false;
      selectList.splice(selectList.indexOf(box),1);
    }
  }

  function toggleSelect( box )
  {
    if( selectList.indexOf(box) == -1 )
    {
      selectBox(box);
    }
    else
    {
      deselectBox(box);
    }
  }

  function pick( e )
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
        break;
      }
    }

    return box;
  }

  function mouseMoveHandler(e)
  {
    var deltaX = e.offsetX - dragOffsetX;
    var deltaY = e.offsetY - dragOffsetY;
    selectList.forEach( function(box) {
      box.x += deltaX;
      box.y += deltaY;
    });
    dragOffsetX = e.offsetX;
    dragOffsetY = e.offsetY;
    pub.redraw();
  }

  function mouseUpHandler(e)
  {
    // was this a double click?
    if(    e.timeStamp - mouseUpTime < 200 
        && e.timeStamp - mouseDownTime < 200 )
    {
      mouseUpTime = 0;
      addBox( e );
    }
    else
    {
      mouseUpTime = e.timeStamp;
      // okay, was it a click?
      if( mouseUpTime - mouseDownTime < 200 )
      {
        if( clickBox )
        {
          if( clickBoxState )
            deselectBox( clickBox );
        }
        else
        {
          selectNone();
        }
      }
      // else must have been a drag. This will have been handled in the drag event. Clean up.
    }

    mouseY = 0;
    mouseX = 0;
    clickBox = null;
    canvas.removeEventListener("mousemove",mouseMoveHandler);
    pub.redraw();
  }

  function mouseDownHandler(e)
  {
    mouseDownTime = e.timeStamp;
    mouseIsDrag = false;

    clickBox=pick(e);
    clickBoxState = clickBox.selected;
    
    if( !event.shiftKey && !event.ctrlKey )
      selectNone();

    selectBox(clickBox);
    dragOffsetX = e.offsetX;
    dragOffsetY = e.offsetY;

    canvas.addEventListener("mousemove",mouseMoveHandler);
  }

  function drawBox( box )
  {
    if( box.selected )
      context.strokeStyle = "#ff0000";
    else
      context.strokeStyle = "#000000";

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
    canvas.addEventListener("mousedown",mouseDownHandler,false);
    canvas.addEventListener("mouseup",mouseUpHandler,false);
    pub.resize();
  }

  return pub;
}());