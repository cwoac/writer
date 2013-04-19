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

 
  var lines = [];








  // line handlers

  // Creates a line from one box to another
  function addLine( from, to )
  {
    // don't allow links to yourself.
    if( !from || !to || from == to ) return;
    // only one link per box pair
    if( my.boxes.IsLinked(from,to) ) return;

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
      my.boxes.add( e );
    }
    else
    {
      // have we done a drag-n-drop?
      var target = my.boxes.pickUnselected(e);
      if( target )
      {
        //link each selected box to the target and put them back in place.
        my.boxes.forEachSelected( function(box){ 
          addLine(box,target);
          box.x = box.origX;
          box.y = box.origY;
        });
      }
      // all the work for clicks / drags will have been already completed.
      mouseUpTime = e.timeStamp;
    }

    clickBox = null;
    my.band.disable();
    canvas.removeEventListener("mousemove",mouseMoveHandler);
    redraw();
  }

  // handles drags. Note, not on by default, added/removed by mouseUp/Down Handlers.
  function mouseMoveHandler(e)
  {
    if( my.boxes.selectedCount() >0 && !my.band.isEnabled() )
    {
      // we are click-dragging one or more boxes.
      var deltaX = e.offsetX - dragOffsetX;
      var deltaY = e.offsetY - dragOffsetY;
      my.boxes.forEachSelected( function(box) {
        box.x += deltaX;
        box.y += deltaY;
      });
    }
    else
    {
      // We must be drawing a rubber band.
      my.band.move(e.offsetX,e.offsetY);
      my.band.select();
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
    clickBox=my.boxes.pick(e);
    clickBoxState = clickBox!=null && clickBox.selected;
    
    // if the user clicks an unselected box and doesn't have shift held down deselect anything else.
    if( !event.shiftKey && !clickBoxState )
      my.boxes.selectNone();

    // select the clicked box (if any)
    my.boxes.select(clickBox);
    // for all selected boxes, save their original location in case we do a drag-n-drop and need to snap back 
    my.boxes.forEachSelected(function(box){
      box.origX = box.x;
      box.origY = box.y;
    })

    // setup for drag deltas
    dragOffsetX = e.offsetX;
    dragOffsetY = e.offsetY;


    if( my.boxes.selectedCount() == 0 ) 
    {
      my.band.enable();
      my.band.set(dragOffsetX,dragOffsetY);
    }

    // enable drag handler
    canvas.addEventListener("mousemove",mouseMoveHandler);
  }

  // drawing functions



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



  // publicly exposed stuff

  // Call this whenever the screen is dirty
  redraw = function()
  {
    // reset the contents of the canvas
    canvas.width = canvas.width;
    lines.forEach(drawLine);
    context.strokeStyle = "#0000ff";
    context.stroke();
    my.boxes.draw(context);
    if( my.band.isEnabled() ) my.band.draw(context);
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
    if( !my.features.testForFeatures() ) window.location = "missing_features.html";
    canvas = document.getElementById("theCanvas");
    context = canvas.getContext("2d");
    canvas.addEventListener("mousedown",mouseDownHandler,false);
    canvas.addEventListener("mouseup",mouseUpHandler,false);
    resize();
  }

  my.redraw = redraw;
  my.resize = resize;
  my.initialise = initialise;

  return my;
}( writer || {}));