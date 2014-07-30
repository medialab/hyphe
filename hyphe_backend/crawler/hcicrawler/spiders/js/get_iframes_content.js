/*
 * get_iframes_content.js
 *
 * -> returns as a string all innerHTML from current document
 *    as well as from all iframes present in the document
 */

var phantom_iframes = document.getElementsByTagName('frame'),
    iframes_content = '',
    iframe_content,
    ph_i, ph_j;
if (!phantom_iframes.length) {
  phantom_iframes = [];
}
phantom_iframes.push(document);
for (ph_i=0; ph_i<phantom_iframes.length; ph_i++) {
  if ("contentDocument" in phantom_iframes[ph_i]) {
    iframe_content = phantom_iframes[ph_i].contentDocument.childNodes;
  } else {
    iframe_content = phantom_iframes[ph_i].childNodes;
  }
  if (iframe_content) {
    for (ph_j=0; ph_j<iframe_content.length; ph_j++) {
      if (iframe_content[ph_j] && "innerHTML" in iframe_content[ph_j]) {
        iframes_content += iframe_content[ph_j].innerHTML;
      }
    }
  }
}
return iframes_content;
