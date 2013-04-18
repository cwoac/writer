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

  var band = {};
  band.x=0;
  band.y=0;
  band.w=0;
  band.h=0;
  band.inUse = false;

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
    if( box && selectList.indexOf(box) == -1 )
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

  function selectBand()
  {
    // shouldn't trigger, but hey.
    if( !band.inUse ) return;

    selectNone();
    var top;
    var bottom;
    var left;
    var right;
    if( band.w > 0 )
    {
      left = band.x;
      right = band.x + band.w;
    }
    else
    {
      left = band.x + band.w;
      right = band.x;
    }

    if( band.h > 0 )
    {
      top = band.y;
      bottom = band.y + band.h;
    }
    else
    {
      top = band.y + band.h;
      bottom = band.y;
    }

    boxes.forEach( function(box){
      if(    (box.x + box.w >= left && box.x <= right)
          && (box.y + box.h >= top && box.y <= bottom) )
      {
        selectBox(box)
      }
    });
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
    if( selectList.length>0 && !band.inUse )
    {
      var deltaX = e.offsetX - dragOffsetX;
      var deltaY = e.offsetY - dragOffsetY;
      selectList.forEach( function(box) {
        box.x += deltaX;
        box.y += deltaY;
      });
    }
    else
    {
      band.w=e.offsetX-band.x;
      band.h=e.offsetY-band.y;
      selectBand();
    }
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
      // all the work for clicks / drags will have been already completed.
      mouseUpTime = e.timeStamp;
    }

    clickBox = null;
    band.inUse = false;
    canvas.removeEventListener("mousemove",mouseMoveHandler);
    pub.redraw();
  }

  function mouseDownHandler(e)
  {
    mouseDownTime = e.timeStamp;
    mouseIsDrag = false;

    clickBox=pick(e);
    clickBoxState = clickBox!=null && clickBox.selected;
    
    // if the user clicks an unselected box and doesn't have shift held down deselect anything else.
    if( !event.shiftKey && !clickBoxState )
      selectNone();

    selectBox(clickBox);
    dragOffsetX = e.offsetX;
    dragOffsetY = e.offsetY;
    band.x = dragOffsetX;
    band.y = dragOffsetY;

    if( selectList.length == 0 ) band.inUse = true;

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

  function drawBand()
  {
    context.strokeStyle = "#00ff00";
    context.strokeRect( band.x, band.y, band.w, band.h );
  }

  // publicly exposed stuff
  var pub = {};

  // Call this whenever the screen is dirty
  pub.redraw = function()
  {
    // reset the contents of the canvas
    canvas.width = canvas.width;
    boxes.forEach(drawBox);
    if( band.inUse ) drawBand();
  }

  pub.listMissingFeatures = function()
  {
    if( !Modernizr.canvas ) logFeature( "No canvas.");
    if( !Modernizr.canvastext ) logFeature( "No canvas text.");
    if( !Modernizr.indexeddb ) logFeature( "No indexeddb.");
  }

  pub.resize = function()
  {
    // TODO:: Figure out what these should really be
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;    
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