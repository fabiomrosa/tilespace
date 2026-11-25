/*
    Surface
    -------
*/

App.surface = (function (Surface) {
  "use strict";

  //=====================
  // VARS
  //=====================

  var $grid = null;
  var $wall = null;

  var $rows = 4;
  var $columns = 8;
  var $tile = 120;
  var $margin = 10;
  var $panels = [];
  var $panelsUsed = 0;
  var $pages = 0;
  var $pagesIndex = 0;
  var $numPages = 0;
  var $filter = "";

  var _surface = ".surface";
  var _surfaceContent = ".surface-content";
  var _surfaceWall = ".surface-wall";

  var $loaded = 1;
  var $numRows = AppSession.SURFACE_NUM_ITEMS;

  //=====================
  // PUBLIC
  //=====================

  Surface.initialize = function (columns, rows) {
    if (rows == undefined) rows = 4;
    if (columns == undefined) columns = 8;
    $rows = rows;
    $columns = columns;

    console.log("--------------------------------------------");
    console.log("*** SURFACE ---> initialize");

    surfaceInit();
  };

  Surface.show = function () {
    $wall.show();
  };

  Surface.hide = function () {
    $wall.hide();
  };

  Surface.pages = function () {
    return $pages;
  };

  Surface.current = function () {
    return $pagesIndex;
  };

  Surface.hasNextPage = function () {
    if ($panelsUsed < $numRows) {
      return true;
    }
    return $pages < $pagesIndex - 1;
  };

  Surface.prev = function () {
    surfaceNavigate("PREV");
  };

  Surface.next = function () {
    surfaceNavigate("NEXT");
  };

  Surface.filter = function (filter) {
    surfaceFilter(filter);
  };

  Surface.bind = function (event, callback) {
    $(Surface).bind(event, callback);
  };

  //=====================
  // SURFACE
  //=====================

  function surfaceInit() {
    $panels = [];
    $panelsUsed = 0;
    $pages = 0;
    $pagesIndex = 0;
    $loaded = 1;
    $numRows = AppSession.SURFACE_NUM_ITEMS;

    $grid = new Grid();
    $wall = new Wall();

    surfaceSet();
    surfaceLoad();
  }

  function surfaceReset() {
    //if($loaded == 1) $pagesIndex--;
    surfaceLoad();
  }

  function surfaceSet() {
    $(_surface).css({ position: "absolute" });
    $(_surfaceContent).css({ position: "relative" });
    $(_surfaceWall)
      .css({ position: "absolute" })
      .children()
      .each(function (index, element) {
        if (!$(element).data("hide")) {
          surfacePush({ type: $(this).data("type"), elem: $(this) });
        }
      });
  }

  function surfaceNavigate(orientation) {
    console.log("*** SURFACE NAVIGATE ---> page: " + $pages);

    if (orientation == "PREV") {
      surfaceNavigatePrevious();
      $(Surface).trigger("SURFACE_CHANGE_PAGE");
    } else if (orientation == "NEXT") {
      surfaceNavigateNext();
    }
  }

  function surfaceNavigatePrevious() {
    if ($pages > 0) {
      $pages--;
      TweenMax.to($(_surfaceContent), 0.5, {
        css: { left: -(($tile + $margin) * $columns * $pages) },
        ease: Cubic.easeOut,
      });
      //$wall.hide();
      //$wall.show();
    }
  }

  function surfaceNavigateNext() {
    // if( $pages < ( $pagesIndex - 1 ) )
    // {
    //     $pages++;
    //     TweenMax.to( $( _surfaceContent ), .5, { css:{ left: -( ( ( $tile + $margin ) * $columns ) * $pages ) }, ease: Cubic.easeOut } );
    //     //$wall.hide();
    //     //$wall.show();
    // }

    $pages++;

    TweenMax.to($(_surfaceContent), 0.5, {
      css: { left: -(($tile + $margin) * $columns * $pages) },
      ease: Cubic.easeOut,
    });

    //if($pages <= $loaded){
    if ($panelsUsed == $numRows) {
      $wall.show();
      $(Surface).trigger("SURFACE_CHANGE_PAGE");
      return;
    }

    var index = $loaded * 32;

    if (window.location.href.indexOf("?") > -1) {
      $filter = "?" + window.location.href.split("?")[1];
    }

    $.ajax({
      type: "POST",
      url: AppSession.SURFACE_NEXT_URL + index + $filter,
      data: {},
      dataType: "text",
      cache: true,
    }).done(function (result) {
      console.log("dibe", $pagesIndex);

      $loaded++;

      var newTiles = $(result);

      newTiles.each(function (index, element) {
        if ($(element).attr("class") == "tile") {
          var tile = $(element);
          $(_surfaceWall).append(tile);
          surfacePush({ type: tile.data("type"), elem: tile });
        }
      });

      App.history.pushstate();

      surfaceLoad();
      $(Surface).trigger("SURFACE_CHANGE_PAGE");
    });
  }

  function surfaceLoad() {
    console.log("*** SURFACE ---> load", $panelsUsed, $panels.length);

    while ($panelsUsed < $panels.length) {
      $grid.load();
      $wall.load();

      $pagesIndex++;
      console.log("surfaceLoad", $panelsUsed, $panels.length);
    }

    console.log("PANELS", $panelsUsed, $numRows);
    if ($panelsUsed == $numRows) {
      //$pagesIndex = $pages;
      console.log("DONT HAVE ANYTHING ELSE TO LOAD!", $pages, $pagesIndex);
    }

    console.log("complete");

    $wall.show();
  }

  function surfacePush(data) {
    $panels.push({
      page: data.page,
      used: false,
      type: data.type,
      elem: data.elem,
    });
  }

  function surfaceFilter(filter) {
    console.log("FILTER", filter);
    $filter = "?filter=true";
    $filter += "&min_price=" + filter.min_price;
    $filter += "&max_price=" + filter.max_price;
    $filter += "&category=" + filter.category;
    $filter += "&brand=" + filter.brands;
    $filter += "&ingredient=" + filter.ingredient;
    $filter += "&goal=" + filter.goal;

    $pages = 0;

    var $url = window.location.href.split(App.url.base).join("").split("?")[0];
    App.history.go($url + $filter);
  }

  //=====================
  // GRID
  //=====================

  function Grid() {
    var $index = 0;
    var $data = [];

    this.data = function () {
      return $data;
    };

    this.load = function () {
      console.log("*** SURFACE GRID ---> load");

      for (var r = 0; r < $rows; r++) {
        for (var c = 0; c < $columns; c++) {
          var x = ($tile + $margin) * c + $columns * (($tile + $margin) * $pagesIndex);
          var y = ($tile + $margin) * r;

          $data.push({ x: x, y: y, used: false });

          $index++;
        }
      }

      //console.log( '*** SURFACE GRID ---> loaded data:', $data );
    };
  }

  //=====================
  // WALL
  //=====================

  function Wall() {
    var $index = 0;

    this.show = function () {
      var i = 0;
      for (var s = 0; s < $panels.length; s++) {
        var $panel = $panels[s];

        $panel.elem.find("a").unbind("click", panelsOnClick).bind("click", panelsOnClick);

        //if( $panel.page === $pages || $panel.page === null )
        if ($panel.page == $pages) {
          //$panel.elem.css({marginLeft : 10, opacity:0})
          TweenMax.to($panel.elem, 0.5, {
            css: { marginLeft: 0, opacity: 1 },
            ease: Sine.easeOut,
            delay: 0.5 + (i % 4) / 10 + i / 50,
          });
          i++;
        }
      }
    };

    this.hide = function () {
      console.log("*** SURFACE WALL ---> hide", $panels.length);
      var i = 0;
      for (var h = 0; h < $panels.length; h++) {
        var $panel = $panels[h];

        if ($panel.page == $pages) {
          TweenMax.to($panel.elem, 0.25, {
            css: { marginLeft: -10, opacity: 0 },
            ease: Sine.easeOut,
            delay: (i % 4) / 10 + i / 40,
          });
          i++;
        }
      }
    };

    this.load = function () {
      console.log("*** SURFACE WALL ---> load");

      for (var r = 0; r < $rows; r++) {
        for (var c = 0; c < $columns; c++) {
          if ($grid.data()[$index] != undefined) {
            if ($grid.data()[$index].used == false) {
              var item = fit($index);

              if (item) {
                //item.page = $pagesIndex;
                item.page = Math.floor($index / 32);
                item.used = true;

                $(item.elem).data("index", $index);

                add($index, item);

                $panelsUsed++;
              } else {
                //stop the loop when theres no more tiles
                break;
              }
            }
          }

          $index++;
        }
      }

      //this.show();
    };

    function fit(index) {
      for (var f = 0; f < $panels.length; f++) {
        if ($panels[f].used) {
          continue;
        }

        if (check(index, $panels[f].type)) {
          return $panels[f];
        }
      }
    }

    function check(index, type) {
      var c = parseInt(type.split("x")[0]);
      var r = parseInt(type.split("x")[1]);
      var x = index % $columns;
      var y = Math.floor(index / $columns);

      for (var cc = x; cc < x + c; cc++) {
        for (var cr = y; cr < y + r; cr++) {
          var i = cr * $columns + cc;

          if ($grid.data()[i] == undefined || $grid.data()[i].used || cc > $columns) {
            return false;
          }
        }
      }

      return true;
    }

    function add(index, item) {
      var c = parseInt(item.type.split("x")[0]);
      var r = parseInt(item.type.split("x")[1]);
      var x = index % $columns;
      var y = Math.floor(index / $columns);
      var panel = new Panel({
        item: item.elem,
        x: $grid.data()[index].x,
        y: $grid.data()[index].y,
      });

      for (var ac = x; ac < x + c; ac++) {
        for (var ar = y; ar < y + r; ar++) {
          var i = ar * $columns + ac;

          if ($grid.data()[i] != undefined) {
            $grid.data()[i].used = true;
          }
        }
      }
    }
  }

  //=====================
  // PANEL
  //=====================

  function Panel(data) {
    var $panel = data.item;
    var _panelBackground = ".tile-container-content-background img";
    var _panelImage = ".tile-container-content-product-image img";
    var _panelImageLoading = "tile-container-content-product-loading";

    $($panel).css({
      visibility: "visible",
      display: "block",
      position: "absolute",
      opacity: 0,
      top: data.y,
      left: data.x,
    });

    if ($($panel).find(_panelBackground).length > 0) {
      if ($($panel).find(_panelBackground).complete) {
        $($panel).find(_panelBackground).css({ top: "0%" });
        //TweenMax.to( $( $panel ).find( _panelBackground ), .5, { css:{ opacity: 1 }, ease: Sine.easeOut, delay: ( Math.random() / 2 ) });
      } else {
        $($panel)
          .find(_panelBackground)
          .bind("load", function () {
            $($panel).find(_panelBackground).css({ top: "0%" });
            //TweenMax.to( $( $panel ).find( _panelBackground ), .5, { css:{ opacity: 1 }, ease: Sine.easeOut, delay: ( Math.random() / 2 ) });
          });
      }
    }

    if ($($panel).find(_panelImage).complete) {
      $($panel).removeClass(_panelImageLoading);
      $($panel)
        .find(_panelImage)
        .css({ marginTop: ($(this).height() / 2) * -1 });
      TweenMax.to($($panel).find(_panelImage), 0.5, {
        css: { opacity: 1 },
        ease: Sine.easeOut,
        delay: Math.random() / 2,
      });
    } else {
      $($panel)
        .find(_panelImage)
        .bind("load", function () {
          $(this).parent().removeClass(_panelImageLoading);
          $(this).css({ marginTop: ($(this).height() / 2) * -1 });
          TweenMax.to($(this), 0.25, {
            css: { opacity: 1 },
            ease: Sine.easeOut,
            delay: Math.random() / 2,
          });
        });
    }
  }

  function panelsOnClick() {
    console.log("click", $(this).parent().data("size"));
    AppSession.PRODUCT.size = $(this).parent().data("size");
  }

  return Surface;
})(App.surface || {});
