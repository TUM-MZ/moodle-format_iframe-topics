// Javascript functions for Topics course format

M.course = M.course || {};

M.course.format = M.course.format || {};

/**
 * Get sections config for this format
 *
 * The section structure is:
 * <ul class="topics">
 *  <li class="section">...</li>
 *  <li class="section">...</li>
 *   ...
 * </ul>
 *
 * @return {object} section list configuration
 */
M.course.format.get_config = function() {
    return {
        container_node : 'ul',
        container_class : 'topics',
        section_node : 'li',
        section_class : 'section'
    };
}

/**
 * Swap section
 *
 * @param {YUI} Y YUI3 instance
 * @param {string} node1 node to swap to
 * @param {string} node2 node to swap with
 * @return {NodeList} section list
 */
M.course.format.swap_sections = function(Y, node1, node2) {
    var CSS = {
        COURSECONTENT : 'course-content',
        SECTIONADDMENUS : 'section_add_menus'
    };

    var sectionlist = Y.Node.all('.'+CSS.COURSECONTENT+' '+M.course.format.get_section_selector(Y));
    // Swap menus.
    sectionlist.item(node1).one('.'+CSS.SECTIONADDMENUS).swap(sectionlist.item(node2).one('.'+CSS.SECTIONADDMENUS));
}

/**
 * Process sections after ajax response
 *
 * @param {YUI} Y YUI3 instance
 * @param {array} response ajax response
 * @param {string} sectionfrom first affected section
 * @param {string} sectionto last affected section
 * @return void
 */
M.course.format.process_sections = function(Y, sectionlist, response, sectionfrom, sectionto) {
    var CSS = {
        SECTIONNAME : 'sectionname'
    },
    SELECTORS = {
        SECTIONLEFTSIDE : '.left .section-handle img'
    };

    if (response.action == 'move') {
        // If moving up swap around 'sectionfrom' and 'sectionto' so the that loop operates.
        if (sectionfrom > sectionto) {
            var temp = sectionto;
            sectionto = sectionfrom;
            sectionfrom = temp;
        }

        // Update titles and move icons in all affected sections.
        var ele, str, stridx, newstr;

        for (var i = sectionfrom; i <= sectionto; i++) {
            // Update section title.
            sectionlist.item(i).one('.'+CSS.SECTIONNAME).setContent(response.sectiontitles[i]);
            // Update move icon.
            ele = sectionlist.item(i).one(SELECTORS.SECTIONLEFTSIDE);
            str = ele.getAttribute('alt');
            stridx = str.lastIndexOf(' ');
            newstr = str.substr(0, stridx +1) + i;
            ele.setAttribute('alt', newstr);
            ele.setAttribute('title', newstr); // For FireFox as 'alt' is not refreshed.
        }
    }
}


/**
 * load iframe on click
 *
 * @param {YUI} Y YUI3 instance
 * @return void
 */

M.course.format.iframetopic = function(Y){
    var links = Y.all('.iframelink');


    links.on('click', function(e){
        e.preventDefault();
        var link = e.currentTarget;
        if(!(link.hasClass('clicked') || link.hasClass('dimmed_text'))){
            var parent = link.ancestor().insert("<iframe src = " + link.getAttribute('href')+ " max-height='500px' onload='M.course.format.iframetopic.afterLoadIframe(this)' style='display:none'></iframe>", 'after');
            var iframe = parent.next('iframe');
            // initialize history counts
            iframe.getDOMNode()._back_length = -1; // to compensate for the first load
            iframe.getDOMNode()._forward_length = 0;
            M.course.format.iframetopic.renderNavForIFrame(iframe);

            // bind reloading function to iframe object for later use
            iframe.getDOMNode()._triggerReloading = M.course.format.iframetopic.triggerReloading.bind(null, link, iframe);
            // set it to handle unload events (i.e. a link is clicked in iframe)
            iframe.getDOMNode().contentWindow.onbeforeunload = iframe.getDOMNode()._triggerReloading;
            // and invoke it now, since we are loading an iframe
            iframe.getDOMNode()._triggerReloading();
            //stop loading multiple iframe by adding clicked class to link
            link.addClass('clicked');
        }
        else if(link.hasClass('clicked')){
            link.ancestor().next('iframe').remove();
            link.removeClass('clicked');
        }
    });

    Y.all('.iframe_nav .go_back, .iframe_nav .go_forward').on('click', function(e) {
      e.preventDefault();
      var iframe = e.currentTarget.ancestor().ancestor().ancestor().one('iframe');
      var history = iframe.getDOMNode().contentWindow.history;
      if (e.currentTarget.hasClass('go_back')) {
        iframe.getDOMNode()._forward_length += 1;
        iframe.getDOMNode()._back_length -= 1;
        iframe.getDOMNode()._triggered_by_history = true;
        history.back();
      } else if (e.currentTarget.hasClass('go_forward')) {
        iframe.getDOMNode()._forward_length -= 1;
        iframe.getDOMNode()._back_length += 1;
        iframe.getDOMNode()._triggered_by_history = true;
        history.forward();
      }
    });

    var default_li = Y.one('.current_li');
    if(default_li){
        var link = default_li.one('a.iframelink').getDOMNode();
        link.click();
        window.scroll(0, M.course.format.iframetopic.findPos(link));
    }
}

M.course.format.iframetopic.renderNavForIFrame = function(iframe) {
  var back = iframe.ancestor().one('.go_back');
  var forward = iframe.ancestor().one('.go_forward');
  var back_length = iframe.getDOMNode()._back_length;
  var forward_length = iframe.getDOMNode()._forward_length;
  if (back_length > 0) {
    back.addClass('enabled');
  } else {
    back.removeClass('enabled');
  }
  if (forward_length > 0) {
    forward.addClass('enabled');
  } else {
    forward.removeClass('enabled');
  }
}

M.course.format.iframetopic.triggerReloading = function(link, iframe) {
  link.ancestor().one('.iframe_nav').append('<span class="loadingspan"></span>')
  iframe.setStyle('height', 0);
}

M.course.format.iframetopic.afterLoadIframe = function(iframe) {
    var ydoc = Y.one(iframe.contentWindow.document);
    // rebind reloading routine since content window has changed
    iframe.contentWindow.onbeforeunload = iframe._triggerReloading;


    // if the page change wasn't a history action
    if (!iframe._triggered_by_history) {
      // reset history lengths and rerender controls
      iframe._back_length += 1;
      iframe._forward_length = 0;
    } else {
      // reset the flag
      iframe._triggered_by_history = false;
    }
    M.course.format.iframetopic.renderNavForIFrame(Y.one(iframe));

    //only div to keep. the content.
    var output = ydoc.one('#region-main .region-content .single-section');
    if (!!output) {
      // a section view
      output = output.one('.topics');
    } else {
      // a course activity
      output = ydoc.one('#region-main .region-content');
    }
    output.setStyle('margin', '1em');
    output.setStyle('padding', '0px');

    //cross domain urls to open in new tab
    output.all("a").each(function(link){
        var href = link.getAttribute("href");
        if(((href.startsWith('http') || href.startsWith('https') || href.startsWith('ftp')) &&
            !href.startsWith(window.location.origin)) ||
                href.indexOf("/mod/url") != -1){
            link.setAttribute("target", "_blank");
        }
    });

    // things to copy outside of the initial div
    var elem_type = ['link',  'script', 'style', 'param'];       //types of element to keep
    for(var e in elem_type){
        ydoc.all(elem_type[e]).each(function(node){
           output.prepend(node);
        });
    }

    //copying ancestors but keeping their content blank
    while(output.ancestor() != null){
        var temp = output.ancestor();
        temp.setStyle('margin', '0px');
        temp.setStyle('padding', '0px');
        temp.get('children').each(function(child){
            if (child != output){
                child.remove();
            }
        });
        output = temp;
    }
    ydoc.one("#page").setStyle('min-height', 0);


    iframe.style.display = 'block';

    // set iframe height to the new doc height
    var content_height = parseInt(output.getComputedStyle('height').replace('px', '')) + 10;
    iframe.style.height = content_height + 'px';

    //set edited iframe content to display
    ydoc.setHTML(output);

    // remove loading indicator
    Y.all('.loadingspan').remove();
}

M.course.format.iframetopic.findPos = function(obj) {
    var curtop = 0;
    if (obj.offsetParent) {
        do {
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return [curtop];
    }
}
