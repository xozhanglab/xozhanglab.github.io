(function ($) {
  // Returns a function that delays invoking fn until after wait ms have elapsed
  // since the last time the returned function was called (debounce).
  function debounce(fn, wait) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function filterList(header, list) {
    var deftext = "Filter by keyword ... (e.g. 'TE')";
    var filterform = $("<form>").attr({ "class": "searchbox", "action": "#" });
    var input = $("<input>").attr({ "class": "searchbox", "type": "text", "value": deftext, "rel": deftext });
    var clear = $("<a>").text("").attr({ "class": "searchbox", "href": "" }).css("visibility", "hidden");

    filterform.append(clear).append(input).appendTo(header);

    // Cache the original HTML of each filterable block once at init time so
    // that it can be faithfully restored when the filter is cleared.
    list.find("li").each(function () {
      $(this).children(".pubtitle, .pubabstract, .pubauthors, .pubjournal").each(function () {
        $(this).data("originalHtml", $(this).html());
      });
    });

    input.blur(function () {
      var def = $(this).attr("rel");
      if ($(this).val() === "") { $(this).val(def); }
    }).focus(function () {
      var def = $(this).attr("rel");
      if ($(this).val() === def) { $(this).val(""); }
    });

    clear.click(function (e) {
      e.preventDefault();
      input.val("").focus();
      clear.css("visibility", "hidden");
      applyFilter();
    });

    function applyFilter() {
      var filter = input.val();
      if (filter) {
        var trimmed = filter.replace(/^\s+|\s+$/g, "");
        var phrase = "\\b(" + trimmed.replace(/\s+/g, "|") + ")";
        // Compile the regex once per filter invocation rather than once per
        // list item – this is the main performance improvement for large lists.
        var regex = new RegExp(phrase, "gi");
        var shouldHighlight = trimmed.length > 2;
        var count = 0;

        list.find("li").each(function () {
          var lib = $(this);
          var matches = false;

          lib.children(".pubtitle, .pubabstract, .pubauthors, .pubjournal").each(function () {
            var block = $(this);
            var matched = false;
            // Use the cached original HTML as the source so that repeated
            // filtering does not compound or lose any existing markup.
            var highlighted = block.data("originalHtml").replace(regex, function (match) {
              matches = true;
              matched = true;
              if (shouldHighlight) {
                return "<span class='highlight'>" + match + "</span>";
              }
              return match;
            });
            block.html(highlighted);

            if (block.is(".pubabstract")) {
              if (matched) { block.slideDown(); } else { block.slideUp(); }
            }
          });

          if (matches) { lib.slideDown(); count++; } else { lib.slideUp(); }
        });

        clear.css("visibility", "visible");
        $(".filter-count").text(count + " results on this page!");
      } else {
        // Restore original HTML for every filterable block.
        list.find("li").each(function () {
          $(this).children(".pubtitle, .pubabstract, .pubauthors, .pubjournal").each(function () {
            $(this).html($(this).data("originalHtml"));
          });
        });
        list.find("li").slideDown();
        $(".pubabstract").slideUp();
        clear.css("visibility", "hidden");
        $(".filter-count").text("");
      }
      return false;
    }

    input.change(applyFilter);
    // Debounce keyup so the filter only runs after the user pauses typing
    // rather than on every keystroke, avoiding unnecessary DOM work.
    input.keyup(debounce(applyFilter, 250));
  }

  $(function () {
    filterList($("#filterform"), $("#filterlist"));
  });
}(jQuery));

$(document).ready(function () {
  $("input.searchbox:first").focus();
  $("#filterlist li").click(function () {
    $(this).children(".pubabstract").toggle("fast");
  });
});
