const template = document.createElement("div");
template.innerHTML = (

    //'<div class=winbox>' +

        '<div class=wb-header>' +
            '<div class=wb-control>' +
                '<span title="Minimize" class=wb-min></span>' +
                '<span title="Maximize" class=wb-max></span>' +
                '<span title="Fullscreen" class=wb-full></span>' +
                '<span title="Close" class=wb-close></span>' +
            '</div>' +
            '<div class=wb-drag>'+
                '<div class=wb-icon></div>' +
                '<div class=wb-title></div>' +
            '</div>' +
        '</div>' +

        '<div class=wb-body></div>' +

        '<div class=wb-n></div>' +
        '<div class=wb-s></div>' +
        '<div class=wb-w></div>' +
        '<div class=wb-e></div>' +
        '<div class=wb-nw></div>' +
        '<div class=wb-ne></div>' +
        '<div class=wb-se></div>' +
        '<div class=wb-sw></div>'

    //'</div>'
);

export function markup(tpl){

    return (tpl || template).cloneNode(true);
}

// The CSS below is used as text.
// Hence it should not contain properties like @import or url that needs parsing.
export const winboxcss = `
  .winbox {
    position: fixed;
    left: 0;
    top: 0;
    background: #0050ff;
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
    /* using transform make contents blur when applied and requires more gpu memory */
    transition: width 0.3s, height 0.3s, left 0.3s, top 0.3s;
    transition-timing-function: cubic-bezier(0.3, 1, 0.3, 1);
    /* contain "strict" does not make overflow contents selectable */
    contain: layout size;
    /* explicitly set text align to left fixes an issue with iframes alignment when centered */
    text-align: left;
    /* workaround for using passive listeners */
    touch-action: none;
  }
  .wb-header {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 35px;
    line-height: 35px;
    color: #fff;
    overflow: hidden;
    z-index: 1;
  }
  .wb-body {
    position: absolute;
    top: 35px;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    overflow-scrolling: touch;
    will-change: contents;
    background: #fff;
    /* when no border is set there is some thin line visible */
    /* always hide top border visually */
    margin-top: 0 !important;
    contain: strict;
    z-index: 0;
  }
  body > .wb-body {
    position: relative;
    display: inline-block;
    visibility: hidden;
    contain: none;
  }
  .wb-drag {
    height: 100%;
    padding-left: 10px;
    cursor: move;
  }
  .wb-title {
    font-family: Arial, sans-serif;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .wb-icon {
    display: none;
    width: 20px;
    height: 100%;
    margin: -1px 8px 0 -3px;
    float: left;
    background-repeat: no-repeat;
    background-size: 100%;
    background-position: center;
  }
  .wb-n {
    position: absolute;
    top: -5px;
    left: 0;
    right: 0;
    height: 10px;
    cursor: n-resize;
    z-index: 2;
  }
  .wb-e {
    position: absolute;
    top: 0;
    right: -5px;
    bottom: 0;
    width: 10px;
    cursor: w-resize;
    z-index: 2;
  }
  .wb-s {
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 0;
    height: 10px;
    cursor: n-resize;
    z-index: 2;
  }
  .wb-w {
    position: absolute;
    top: 0;
    left: -5px;
    bottom: 0;
    width: 10px;
    cursor: w-resize;
    z-index: 2;
  }
  .wb-nw {
    position: absolute;
    top: -5px;
    left: -5px;
    width: 15px;
    height: 15px;
    cursor: nw-resize;
    z-index: 2;
  }
  .wb-ne {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 15px;
    height: 15px;
    cursor: ne-resize;
    z-index: 2;
  }
  .wb-sw {
    position: absolute;
    bottom: -5px;
    left: -5px;
    width: 15px;
    height: 15px;
    cursor: ne-resize;
    z-index: 2;
  }
  .wb-se {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 15px;
    height: 15px;
    cursor: nw-resize;
    z-index: 2;
  }
  .wb-control {
    float: right;
    height: 100%;
    max-width: 100%;
    text-align: center;
  }
  .wb-control * {
    display: inline-block;
    width: 30px;
    height: 100%;
    max-width: 100%;
    background-position: center;
    background-repeat: no-repeat;
    cursor: pointer;
  }
  .wb-min {
    background-image: url("../../assets/min.svg");
    background-size: 14px auto;
    background-position: center calc(50% + 6px);
  }
  .wb-max {
    background-image: url("../../assets/max.svg");
    background-size: 17px auto;
  }
  .wb-close {
    background-image: url("../../assets/close.svg");
    background-size: 15px auto;
    background-position: 5px center;
  }
  .wb-full {
    background-image: url("../../assets/full.svg");
    background-size: 16px auto;
  }
  /*
  .winbox:not(.max) .wb-max {
    background-image: url(@restore);
    background-size: 20px auto;
    background-position: center bottom 5px;
  }
  */
  /*
  .winbox:fullscreen{
    transition: none !important;
  }
  .winbox:fullscreen .wb-full{
    background-image: url(@minimize);
  }
  .winbox:fullscreen > div,
  .winbox:fullscreen .wb-title,
  */
  .winbox.modal .wb-body ~ div,
  .winbox.modal .wb-drag,
  .winbox.min .wb-body ~ div,
  .winbox.max .wb-body ~ div {
    pointer-events: none;
  }
  .winbox.max .wb-drag {
    cursor: default;
  }
  .winbox.min .wb-full,
  .winbox.min .wb-min {
    display: none;
  }
  .winbox.min .wb-drag {
    cursor: default;
  }
  .winbox.min .wb-body > * {
    display: none;
  }
  .winbox.hide {
    display: none;
  }
  .winbox.max {
    box-shadow: none;
  }
  .winbox.max .wb-body {
    margin: 0 !important;
  }
  .winbox iframe {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 0;
  }
  body.wb-lock .winbox {
    will-change: left, top, width, height;
    transition: none;
  }
  body.wb-lock iframe {
    pointer-events: none;
  }
  .winbox.modal:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    border-radius: inherit;
  }
  .winbox.modal:after {
    content: '';
    position: absolute;
    top: -50vh;
    left: -50vw;
    right: -50vw;
    bottom: -50vh;
    background: #0d1117;
    animation: wb-fade-in 0.2s ease-out forwards;
    z-index: -1;
  }
  .winbox.modal .wb-min,
  .winbox.modal .wb-max,
  .winbox.modal .wb-full {
    display: none;
  }
  @keyframes wb-fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 0.85;
    }
  }
  .no-animation {
    transition: none;
  }
  .no-shadow {
    box-shadow: none;
  }
  .no-header .wb-header {
    display: none;
  }
  .no-header .wb-body {
    top: 0;
  }
  .no-min .wb-min {
    display: none;
  }
  .no-max .wb-max {
    display: none;
  }
  .no-full .wb-full {
    display: none;
  }
  .no-close .wb-close {
    display: none;
  }
  .no-resize .wb-body ~ div {
    display: none;
  }
  .no-move:not(.min) .wb-title {
    pointer-events: none;
  }
  .wb-body .wb-hide {
    display: none;
  }
  .wb-show {
    display: none;
  }
  .wb-body .wb-show {
    display: revert;
  }
`