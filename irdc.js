/*
 * Popup engine for the interactive reference cards.
 * This file is identical in iRDC300, iRDC450, iFNEK and iFNEK_C; copy it unchanged between them.
 *
 * Each index.html sets, before loading this file:
 *     window.IRDC = { svg: 'card.svg', data: 'equations.json' };
 * and loads MathJax after it.
 *
 * Data file entries are keyed by the id of a box drawn in the SVG:
 *     { "id": "...", "column": "left|middle|right", ... }
 * plus either
 *     "body": "<popup HTML>"                                          (iFNEK cards)
 * or
 *     "title", "equations": [...], "variables": [{ "sym", "def" }],
 *     "description": [{ "p": "..." } or { "eq": "..." }]              (equation cards)
 */
(function () {
    var config = window.IRDC;
    var entries = {};
    var popup, content, openHotspot = null;

    // MathJax reads this when it loads; typeset a popup that was opened before it finished loading
    window.MathJax = {
        startup: {
            typeset: false,
            ready: function () {
                MathJax.startup.defaultReady();
                MathJax.startup.promise.then(typesetPopup);
            }
        }
    };

    // Typeset the popup only, once MathJax has loaded
    function typesetPopup() {
        if (window.MathJax && MathJax.typesetPromise && content.innerHTML) {
            MathJax.typesetPromise([content]);
        }
    }

    // Build the popup HTML for one entry
    function render(entry) {
        if (entry.body) return entry.body;
        var html = '<h1>' + entry.title + '</h1>';
        html += '<h2>Equation:</h2>';
        entry.equations.forEach(function (eq) { html += '<div class="equation">' + eq + '</div>'; });
        html += '<h2>Variables:</h2><ul>';
        entry.variables.forEach(function (v) { html += '<li>' + v.sym + ': ' + v.def + '</li>'; });
        html += '</ul><h2>Description:</h2>';
        entry.description.forEach(function (block) {
            html += block.eq ? '<div class="equation">' + block.eq + '</div>' : '<p>' + block.p + '</p>';
        });
        return html;
    }

    // Plain-text title, used to label hotspots and the popup for screen readers
    function titleOf(entry) {
        var html = entry.title || (entry.body.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || entry.id;
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent.replace(/\\\(|\\\)/g, '').trim();
    }

    // Position the popup near page coordinates (x, y); on phones irdc.css turns it into a bottom sheet
    function place(entry, x, y) {
        const viewportWidth = window.innerWidth;

        popup.style.top = (y + 30) + 'px';

        if (entry.column === 'right') {
            // Right column: position toward center-left
            popup.style.left = Math.max(20, viewportWidth / 2.5 - 300) + 'px';
        } else {
            // Left/middle columns: right of the point if there is room, otherwise left of it
            const rightSpace = viewportWidth - x;
            popup.style.left = (rightSpace >= 650) ? (x + 20) + 'px' : Math.max(20, x - 620) + 'px';
        }

        // Keep the popup fully on screen
        const rect = popup.getBoundingClientRect();
        if (rect.right > viewportWidth) popup.style.left = Math.max(20, viewportWidth - rect.width - 20) + 'px';
        if (rect.left < 0) popup.style.left = '20px';
    }

    function openPopup(hotspot, x, y, fromKeyboard) {
        var entry = entries[hotspot.id];
        if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([content]);
        content.innerHTML = render(entry);
        popup.setAttribute('aria-label', titleOf(entry));
        popup.style.display = 'block';
        openHotspot = hotspot;
        place(entry, x, y);
        typesetPopup();
        if (fromKeyboard) popup.querySelector('.close-btn').focus();
    }

    function closePopup() {
        if (popup.style.display !== 'block') return;
        var hadFocus = popup.contains(document.activeElement);
        popup.style.display = 'none';
        if (hadFocus && openHotspot) openHotspot.focus();
    }
    window.closePopup = closePopup;

    function setUp(svgText, data) {
        const container = document.getElementById('rdcContainer');
        container.innerHTML = svgText;
        const svgElement = container.querySelector('svg');
        if (!svgElement) { console.error('SVG element not found in container'); return; }

        data.forEach(function (entry) {
            entries[entry.id] = entry;
            const area = svgElement.getElementById(entry.id);
            if (!area) { console.warn('Clickable area ' + entry.id + ' not found in SVG.'); return; }
            area.setAttribute('data-hotspot', '');
            area.setAttribute('tabindex', '0');
            area.setAttribute('role', 'button');
            area.setAttribute('aria-label', titleOf(entry));
            // Re-append in data-file order so Tab follows the card's numbering, not the order the boxes were drawn
            area.parentNode.appendChild(area);
        });

        // A mouse click should not give the hotspot keyboard focus (which would leave it highlighted)
        svgElement.addEventListener('mousedown', function (event) {
            if (event.target.closest('[data-hotspot]')) event.preventDefault();
        });

        svgElement.addEventListener('click', function (event) {
            const area = event.target.closest('[data-hotspot]');
            if (area) openPopup(area, event.pageX, event.pageY, false);
        });

        // Enter or Space on a focused hotspot opens it below the hotspot
        svgElement.addEventListener('keydown', function (event) {
            const area = event.target.closest('[data-hotspot]');
            if (!area || (event.key !== 'Enter' && event.key !== ' ')) return;
            event.preventDefault();
            const box = area.getBoundingClientRect();
            openPopup(area, box.left + window.scrollX, box.bottom + window.scrollY - 30, true);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        popup = document.getElementById('equationPopup');
        content = document.getElementById('latexContent');
        popup.setAttribute('role', 'dialog');
        popup.querySelector('.close-btn').addEventListener('click', closePopup);

        // Close on Esc, or on a click outside the popup that is not on another hotspot
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closePopup();
        });
        document.addEventListener('click', function (event) {
            if (!event.target.closest('#equationPopup, [data-hotspot]')) closePopup();
        });

        Promise.all([
            fetch(config.svg).then(function (response) { return response.text(); }),
            fetch(config.data).then(function (response) { return response.json(); })
        ])
            .then(function (results) { setUp(results[0], results[1]); })
            .catch(function (err) { console.error('Error loading card:', err); });
    });
})();
