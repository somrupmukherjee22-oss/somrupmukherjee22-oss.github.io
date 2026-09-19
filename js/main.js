/* =====================================================================
   main.js — how your website BEHAVES

   JavaScript runs in the visitor's browser after the page loads
   (index.html loads it with the "defer" keyword). This file does three
   small jobs:
     1. Draws the simulated transit light curve at the top of the page
     2. Highlights the sidebar link for the section you're reading
     3. Fills in the current year in the footer

   If you never touch this file, the site still works.
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. THE TRANSIT LIGHT CURVE
   We draw into the empty <svg id="transit-plot"> in index.html.
   The plot area is 640 wide and 190 tall (see its viewBox).
   --------------------------------------------------------------------- */
(function drawTransit() {
  const svg = document.getElementById('transit-plot');
  if (!svg) return;   // No figure on this page: nothing to do.

  const NS = 'http://www.w3.org/2000/svg';

  // Small helper: create an SVG element and set its attributes.
  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  // ---- Numbers you can play with -------------------------------------
  const LEFT = 36, RIGHT = 624;     // horizontal extent of the plot
  const TOP_Y = 56;                 // y position when the star is at full brightness
  const BOTTOM_Y = 104;             // y position at the bottom of the dip
                                    // (SVG y grows downward, so bigger = dimmer)
  const START = 230, END = 430;     // where the dip begins and ends
  const RAMP = 36;                  // how long the dip takes to go down or up
  const NOISE = 7;                  // how scattered the data points are
  // --------------------------------------------------------------------

  // Smooth S-shaped curve from 0 to 1 (used for the gentle edges of the dip).
  function smooth(t) { return t * t * (3 - 2 * t); }

  // The "true" light curve: y position for any x position.
  function transitY(x) {
    if (x <= START) return TOP_Y;
    if (x < START + RAMP) return TOP_Y + (BOTTOM_Y - TOP_Y) * smooth((x - START) / RAMP);
    if (x <= END - RAMP) return BOTTOM_Y;
    if (x < END) return BOTTOM_Y - (BOTTOM_Y - TOP_Y) * smooth((x - (END - RAMP)) / RAMP);
    return TOP_Y;
  }

  // A tiny "random" number generator with a fixed seed, so the scatter
  // looks the same every time the page loads.
  function seededRandom(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const random = seededRandom(39);

  // Axes: a vertical line on the left and a horizontal line at the bottom.
  const BASE_Y = 170;
  svg.appendChild(el('path', { class: 'axis', d: `M${LEFT},20 V${BASE_Y} H${RIGHT}` }));

  const xLabel = el('text', { class: 'axis-label', x: RIGHT, y: 187, 'text-anchor': 'end' });
  xLabel.textContent = 'Time';
  svg.appendChild(xLabel);

  const yLabel = el('text', {
    class: 'axis-label', x: 12, y: 95, 'text-anchor': 'middle',
    transform: 'rotate(-90 12 95)'
  });
  yLabel.textContent = 'Brightness';
  svg.appendChild(yLabel);

  // The smooth model line, built as a list of points: M x,y L x,y L x,y ...
  let d = '';
  for (let x = LEFT; x <= RIGHT; x += 2) {
    d += (x === LEFT ? 'M' : 'L') + x + ',' + transitY(x).toFixed(1) + ' ';
  }
  const model = el('path', { class: 'model', d: d });
  svg.appendChild(model);

  // Tell the CSS how long the line is, so it can animate the "drawing" effect.
  model.style.setProperty('--len', Math.ceil(model.getTotalLength()));

  // The scattered data points. Points inside the dip get the class "in-transit"
  // (coloured amber in style.css).
  let i = 0;
  for (let x = LEFT + 8; x <= RIGHT - 4; x += 8) {
    const noise = (random() + random() - 1) * NOISE;   // bell-shaped noise
    const dot = el('circle', {
      class: 'dot' + (x > START + RAMP / 2 && x < END - RAMP / 2 ? ' in-transit' : ''),
      cx: x,
      cy: (transitY(x) + noise).toFixed(1),
      r: 2.6
    });
    dot.style.setProperty('--i', i++);   // used to stagger the fade-in
    svg.appendChild(dot);
  }
})();


/* ---------------------------------------------------------------------
   2. HIGHLIGHT THE CURRENT SECTION IN THE NAVIGATION
   An IntersectionObserver tells us when a section crosses a thin band
   near the upper-middle of the window. When it does, we mark the
   matching sidebar link with aria-current="true"; style.css does the rest.
   --------------------------------------------------------------------- */
(function highlightNav() {
  const links = document.querySelectorAll('.sidebar nav a');
  const sections = document.querySelectorAll('main section[id]');
  if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

  function setActive(id) {
    links.forEach(function (link) {
      if (link.getAttribute('href') === '#' + id) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  setActive(sections[0].id);   // start with the first section highlighted

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(function (section) { observer.observe(section); });
})();


/* ---------------------------------------------------------------------
   3. FOOTER YEAR
   --------------------------------------------------------------------- */
(function setYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
