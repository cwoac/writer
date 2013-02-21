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