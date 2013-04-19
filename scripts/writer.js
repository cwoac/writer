var writer = (function (my)
{
  // private variable declarations here

  // handy pointer to canvas element
  var canvas;
  // even more handy pointer to the canvas' context
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
  var lines = [];


  // the rubber band for multi-selection
  var band = {};
  band.x=0;
  band.y=0;
  band.w=0;
  band.h=0;
  band.inUse = false;

  // used if we run this on a browser missing needed features
  function logFeature( msg )
  {
    var ol = document.getElementById("features");
    var li = document.createElement("li");
    li.innerHTML = msg;
    ol.appendChild(li);
  }

  // check we are able to run.
  function testForFeatures()
  {
    return Modernizr.canvas && Modernizr.canvastext && Modernizr.indexeddb;
  }

  // box manipulation functions


  // create a small, empty box.
  function addBox( e )
  {
    var box = {};
    box.x = e.offsetX-25;
    box.y = e.offsetY-25;
    box.w = 50;
    box.h = 50;
    box.selected = false;
    box.links = [];
    boxes.push( box );
  }

  // checks if there is a link from one box to another.
  // note that links have a direction.
  function boxIsLinkedTo( from, to )
  {
    if( !from || !to ) return false;

    from.links.forEach( function(link){ 
      if( link==to ) return true;
    });

    return false;
  }

  // selection functions


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

    // deselect everything as the band may have shrunk
    selectNone();

    var top;
    var bottom;
    var left;
    var right;
    
    //  work out which corner x,y refer to.
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


    // every box that is touched by the band is selected
    boxes.forEach( function(box){
      if(    (box.x + box.w >= left && box.x <= right)
          && (box.y + box.h >= top && box.y <= bottom) )
      {
        selectBox(box)
      }
    });
  }

  // attempts to pick a box under the cursor
  // ignores already selected boxes
  // picks the top-most box it finds
  // used by drag-n-drop.
  function pickUnselected( e )
  {
    var box = null;
    // loop in reverse order to depth sort
    for( var i=boxes.length-1; i>=0; i-- )
    {
      if(   !boxes[i].selected
          && e.offsetX>boxes[i].x
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

  // attempts to select a box under the cursor
  // will pick the top-most box it finds, if any
  // used by click + double-click
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


  // line handlers

  // Creates a line from one box to another
  function addLine( from, to )
  {
    // don't allow links to yourself.
    if( !from || !to || from == to ) return;
    // only one link per box pair
    if( boxIsLinkedTo(from,to) ) return;

    var line = {}
    line.from = from;
    line.to = to;
    from.links.push( line );
    lines.push( line );

  }

  // mouse handlers
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
      // have we done a drag-n-drop?
      var target = pickUnselected(e);
      if( target )
      {
        //link each selected box to the target and put them back in place.
        selectList.forEach( function(box){ 
          addLine(box,target);
          box.x = box.origX;
          box.y = box.origY;
        });
      }
      // all the work for clicks / drags will have been already completed.
      mouseUpTime = e.timeStamp;
    }

    clickBox = null;
    band.inUse = false;
    canvas.removeEventListener("mousemove",mouseMoveHandler);
    redraw();
  }

  // handles drags. Note, not on by default, added/removed by mouseUp/Down Handlers.
  function mouseMoveHandler(e)
  {
    if( selectList.length>0 && !band.inUse )
    {
      // we are click-dragging one or more boxes.
      var deltaX = e.offsetX - dragOffsetX;
      var deltaY = e.offsetY - dragOffsetY;
      selectList.forEach( function(box) {
        box.x += deltaX;
        box.y += deltaY;
      });
    }
    else
    {
      // We must be drawing a rubber band.
      band.w=e.offsetX-band.x;
      band.h=e.offsetY-band.y;
      selectBand();
    }
    // update the offsets for next call to mouseMove
    dragOffsetX = e.offsetX;
    dragOffsetY = e.offsetY;
    // redraw the screen.
    redraw();
  }

  function mouseDownHandler(e)
  {
    mouseDownTime = e.timeStamp;
    mouseIsDrag = false;

    // did he click anything?
    clickBox=pick(e);
    clickBoxState = clickBox!=null && clickBox.selected;
    
    // if the user clicks an unselected box and doesn't have shift held down deselect anything else.
    if( !event.shiftKey && !clickBoxState )
      selectNone();

    // select the clicked box (if any)
    selectBox(clickBox);
    // for all selected boxes, save their original location in case we do a drag-n-drop and need to snap back 
    selectList.forEach(function(box){
      box.origX = box.x;
      box.origY = box.y;
    })

    // setup for drag deltas
    dragOffsetX = e.offsetX;
    dragOffsetY = e.offsetY;


    if( selectList.length == 0 ) 
    {
      band.inUse = true;
      band.x = dragOffsetX;
      band.y = dragOffsetY;
    }

    // enable drag handler
    canvas.addEventListener("mousemove",mouseMoveHandler);
  }

  // drawing functions

  function drawBox( box )
  {
    if( box.selected )
      context.strokeStyle = "#ff0000";
    else
      context.strokeStyle = "#000000";

    // TODO:: sort by stroke style and use .rect and .stroke
    context.strokeRect( box.x, box.y, box.w, box.h );
  }

  function drawLine( line )
  {
    /*
     * drawing proper lines bound to the edges of the boxes is hard!
     *
     * Note we do all this rather than simply fill the rectangle as we will want to draw arrows
     * we need to figure out the orientation of the target box compared to the souce box
     */ 

    // calculate the midpoints of the two boxes
    var ax = line.from.x + ( line.from.w / 2 );
    var ay = line.from.y + ( line.from.h / 2 );
    var bx = line.to.x + ( line.to.w / 2 );
    var by = line.to.y + ( line.to.h / 2 );
    // these will hold the actual points we draw between
    var Ax = ax;
    var Ay = ay;
    var Bx = bx;
    var By = by;
    // some handy lengths that we will need later on
    var dx = Math.abs(ax-bx);
    var dy = Math.abs(ay-by);

    /*
     *  First we figure out which quadrant we are dealing with
     *  
     *  bx<ax | bx>ax
     *  by<ay | by<ay
     *  -------------
     *  bx<ax | bx>ax
     *  by>ay | by>ay
     *
     *  Then need to figure out which octant to map to.
     *   
     *  \8|1/
     *  7\|/2
     *  -----
     *  6/|\3
     *  /5|4\ 
     *
     *  As we are always drawing centre to centre, as long as the boxes are the same size
     *  the lines must be in opposite quadrants.
     *
     *  TODO:: cache these calculations
     *  TODO:: draw arrows
     *  TODO:: calculate quadrants for mismatched box sizes
     */

    if( bx > ax )
    {
      if( by < ay )
      {
        if( dx < dy )
        {
          // octant #1
          Ay = line.from.y;
          Ax = line.from.x+(line.from.w + ((line.from.h*dx)/dy))/2;
          By = line.to.y+line.to.h;
          Bx = line.to.x+(line.to.w - ((line.to.h*dx)/dy))/2;
        }
        else
        {
          // octant #2
          Ax = line.from.x+line.from.w;
          Ay = line.from.y+(line.from.h - ((line.from.w*dy)/dx))/2;
          Bx = line.to.x;
          By = line.to.y+(line.to.h + ((line.to.w*dy)/dx))/2;
        }
      }
      else
      {
        if( dx > dy )
        {
          // octant #3
          Ax = line.from.x+line.from.w;
          Ay = line.from.y+(line.from.h + ((line.from.w*dy)/dx))/2;
          Bx = line.to.x;
          By = line.to.y+(line.to.h - ((line.to.w*dy)/dx))/2;
        }
        else
        {
          // octant #4
          Ay = line.from.y+line.from.h;
          Ax = line.from.x+(line.from.w + ((line.from.h*dx)/dy))/2;
          By = line.to.y;
          Bx = line.to.x+(line.to.w - ((line.to.h*dx)/dy))/2;
        }
      }
    }
    else
    {
      if( by>ay )
      {
        if( dx < dy )
        {
          // octant #5
          Ay = line.from.y+line.from.h;
          Ax = line.from.x+(line.from.w - ((line.from.h*dx)/dy))/2;
          By = line.to.y;
          Bx = line.to.x+(line.to.w + ((line.to.h*dx)/dy))/2;
        }
        else
        {
          // octant #6
          Ax = line.from.x;
          Ay = line.from.y+(line.from.h + ((line.from.w*dy)/dx))/2;
          Bx = line.to.x+line.to.w;
          By = line.to.y+(line.to.h - ((line.to.w*dy)/dx))/2;
        }
      }
      else
      {
        if( dx < dy )
        {
          // octant #8
          Ay = line.from.y;
          Ax = line.from.x+(line.from.w - ((line.from.h*dx)/dy))/2;
          By = line.to.y+line.to.h;
          Bx = line.to.x+(line.to.w + ((line.to.h*dx)/dy))/2;
        }
        else
        {
          // octant #7
          Ax = line.from.x;
          Ay = line.from.y+(line.from.h - ((line.from.w*dy)/dx))/2;
          Bx = line.to.x+line.to.w;
          By = line.to.y+(line.to.h + ((line.to.w*dy)/dx))/2;
        }
      }
    }


    context.moveTo( Ax,Ay );
    context.lineTo( Bx,By );
  }

  function drawBand()
  {
    context.strokeStyle = "#00ff00";
    context.strokeRect( band.x, band.y, band.w, band.h );
  }

  // publicly exposed stuff

  // Call this whenever the screen is dirty
  redraw = function()
  {
    // reset the contents of the canvas
    canvas.width = canvas.width;
    lines.forEach(drawLine);
    context.strokeStyle = "#0000ff";
    context.stroke();
    boxes.forEach(drawBox);
    if( band.inUse ) drawBand();
  }

  listMissingFeatures = function()
  {
    if( !Modernizr.canvas ) logFeature( "No canvas.");
    if( !Modernizr.canvastext ) logFeature( "No canvas text.");
    if( !Modernizr.indexeddb ) logFeature( "No indexeddb.");
  }

  resize = function()
  {
    // TODO:: Figure out what these should really be
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;    
    redraw();
  }

  initialise = function()
  {
    if( !testForFeatures() ) window.location = "missing_features.html";
    canvas = document.getElementById("theCanvas");
    context = canvas.getContext("2d");
    canvas.addEventListener("mousedown",mouseDownHandler,false);
    canvas.addEventListener("mouseup",mouseUpHandler,false);
    resize();
  }

  my.redraw = redraw;
  my.listMissingFeatures = listMissingFeatures;
  my.resize = resize;
  my.initialise = initialise;

  return my;
}( writer || {}));