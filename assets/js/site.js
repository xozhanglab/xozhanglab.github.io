/* Site interactions: mobile nav, typewriter, scroll reveal, card expand,
   publication filters, hero spotlight, card 3D tilt, progress bar,
   back-to-top and the shrinking header. */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Mobile navigation ---- */
    var navToggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('menu');
    if (navToggle && menu) {
        navToggle.addEventListener('click', function () {
            var open = document.body.classList.toggle('nav-open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        menu.addEventListener('click', function (e) {
            if (e.target && e.target.tagName === 'A') {
                document.body.classList.remove('nav-open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ---- Hero spotlight follows the cursor ---- */
    var hero = document.querySelector('.hero');
    if (hero && !reduceMotion) {
        var spotRaf = null, spotX = 0, spotY = 0;
        hero.addEventListener('mousemove', function (e) {
            var r = hero.getBoundingClientRect();
            spotX = e.clientX - r.left;
            spotY = e.clientY - r.top;
            if (spotRaf) return;
            spotRaf = requestAnimationFrame(function () {
                spotRaf = null;
                hero.style.setProperty('--mx', spotX + 'px');
                hero.style.setProperty('--my', spotY + 'px');
            });
        });
    }

    /* ---- Card 3D tilt ---- */
    if (!reduceMotion) {
        var tiltCards = document.querySelectorAll('[data-tilt]');
        var MAX_TILT = 6;
        Array.prototype.forEach.call(tiltCards, function (card) {
            var raf = null, target = null;
            function apply() {
                raf = null;
                if (!target) return;
                card.style.transform =
                    'perspective(900px) rotateX(' + target.x + 'deg) rotateY(' +
                    target.y + 'deg) translateY(-6px)';
            }
            card.addEventListener('mouseenter', function () {
                card.classList.add('tilting');
            });
            card.addEventListener('mousemove', function (e) {
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                target = { x: (-py * MAX_TILT).toFixed(2), y: (px * MAX_TILT).toFixed(2) };
                if (!raf) raf = requestAnimationFrame(apply);
            });
            card.addEventListener('mouseleave', function () {
                target = null;
                card.classList.remove('tilting');
                card.style.transform = '';
            });
        });
    }

    /* ---- Progress bar, shrinking header, back-to-top ---- */
    var progress = document.getElementById('progress');
    var toTop = document.getElementById('to-top');
    var scrollQueued = false;

    function onScroll() {
        var y = window.pageYOffset || document.documentElement.scrollTop;
        if (progress) {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        }
        if (toTop) toTop.classList.toggle('show', y > 500);
        document.body.classList.toggle('scrolled', y > 24);
        scrollQueued = false;
    }

    window.addEventListener('scroll', function () {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(onScroll);
    }, { passive: true });
    onScroll();

    if (toTop) {
        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    /* ---- Typewriter slogan ---- */
    var typedEl = document.getElementById('typed-text');
    if (typedEl) {
        var phrases = [
            'Decoding noncoding sequences!',
            'Transposable elements & gene regulation',
            'Kinetics of RNA processing',
            'Noncoding RNA complexity'
        ];
        if (reduceMotion) {
            typedEl.textContent = phrases[0];
        } else {
            var phraseIdx = 0, charIdx = 0, deleting = false;
            (function tick() {
                var word = phrases[phraseIdx];
                charIdx += deleting ? -1 : 1;
                typedEl.textContent = word.slice(0, charIdx);
                var delay = deleting ? 32 : 72;
                if (!deleting && charIdx === word.length) {
                    delay = 2300;
                    deleting = true;
                } else if (deleting && charIdx === 0) {
                    deleting = false;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                    delay = 420;
                }
                setTimeout(tick, delay);
            })();
        }
    }

    /* ---- Scroll reveal (staggered) ---- */
    var revealEls = document.querySelectorAll('[data-reveal]');
    Array.prototype.forEach.call(revealEls, function (el) {
        if (!el.parentElement) return;
        var siblings = Array.prototype.filter.call(
            el.parentElement.children,
            function (c) { return c.hasAttribute('data-reveal'); }
        );
        var idx = siblings.indexOf(el);
        if (idx > 0) el.style.transitionDelay = Math.min(idx * 90, 450) + 'ms';
    });

    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('revealed');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12 });
        Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });

        // Jumping straight to the bottom (scrollbar drag, End key) can skip
        // elements entirely, so anything already scrolled past is shown at once.
        window.addEventListener('scroll', function () {
            Array.prototype.forEach.call(
                document.querySelectorAll('[data-reveal]:not(.revealed)'),
                function (el) {
                    if (el.getBoundingClientRect().bottom < 0) {
                        el.style.transitionDelay = '0ms';
                        el.classList.add('revealed');
                    }
                }
            );
        }, { passive: true });
    } else {
        Array.prototype.forEach.call(revealEls, function (el) {
            el.classList.add('revealed');
        });
    }

    /* ---- Research cards: expand / collapse ---- */
    Array.prototype.forEach.call(
        document.querySelectorAll('.research-card .read-more'),
        function (btn) {
            btn.addEventListener('click', function () {
                var card = btn.closest('.research-card');
                var open = card.classList.toggle('expanded');
                // glyph stays put; CSS rotates it when expanded
                btn.innerHTML = open
                    ? 'Show less <span class="arrow">&#8595;</span>'
                    : 'Read more <span class="arrow">&#8595;</span>';
            });
        }
    );

    /* ---- Publication search + year filter ----
       Both conditions feed one refresh() so they never fight over
       li.style.display (which they did when handled separately). ---- */
    var filterForm = document.getElementById('filterform');
    var filterList = document.getElementById('filterlist');
    var pubState = { year: null, term: '' };
    // Keep every searchable part of a publication in one place: adding a
    // field here (or renaming one in the template) must not be forgotten
    // in the highlight, reset or year-extraction code below.
    var PUB_FIELDS = '.pubtitle, .pubauthors, .journal-badge, .pub-year, ' +
        '.pub-cite, .pub-doi, .pubabstract';

    function pubRefresh() {
        if (!filterList) return;
        var items = filterList.children;
        var term = pubState.term;
        // escape the user's text: an unescaped "(" or "[" throws a
        // SyntaxError inside the debounced handler, which silently kills
        // the search with no message
        var plain = term ? new RegExp('\\b(' + term.split(/\s+/).map(function (w) {
            return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('|') + ')', 'gi') : null;
        var highlight = term.length > 2;
        var hits = 0;

        Array.prototype.forEach.call(items, function (li) {
            var matched = false;
            Array.prototype.forEach.call(li.querySelectorAll(PUB_FIELDS),
                function (el) {
                    var orig = el.dataset.originalHtml;
                    if (orig === undefined) return;
                    if (!plain) {
                        el.innerHTML = orig;
                    } else {
                        var fieldHit = false;
                        el.innerHTML = orig.replace(plain, function (m) {
                            fieldHit = true;
                            return highlight ? '<span class="highlight">' + m + '</span>' : m;
                        });
                        if (fieldHit) matched = true;
                    }
                });

            var yearOk = !pubState.year || li.getAttribute('data-year') === pubState.year;
            var show = yearOk && (!term || matched);
            li.style.display = show ? '' : 'none';
            if (show) hits++;

            // <details> owns the disclosure; reveal matches, never force-close
            // a panel the reader opened themselves
            var d = li.querySelector('.pub-abstract');
            if (d && term && matched && show) d.open = true;
        });

        var emptyEl = document.getElementById('pub-empty');
        if (emptyEl) {
            emptyEl.hidden = hits !== 0 || (!term && !pubState.year);
            if (!emptyEl.hidden) {
                emptyEl.textContent = 'No papers match' +
                    (term ? ' "' + term + '"' : '') +
                    (pubState.year ? ' in ' + pubState.year : '') +
                    '. Try a shorter keyword, or clear the year filter.';
            }
        }

        var countEl = document.querySelector('.filter-count');
        if (countEl) {
            if (!pubState.year && !term) {
                countEl.textContent = '';
            } else {
                countEl.textContent = hits + (hits === 1 ? ' paper' : ' papers')
                    + (pubState.year ? ' in ' + pubState.year : '')
                    + (term ? ' matching "' + term + '"' : '');
            }
        }
        return hits;
    }

    if (filterForm && filterList && filterList.querySelector('.pubtitle')) {
        var hint = window.innerWidth < 560
            ? 'Filter by keyword ...'
            : "Filter by keyword ... (e.g. 'TE')";

        var form = document.createElement('form');
        form.className = 'searchbox';
        form.setAttribute('action', '#');

        var clearBtn = document.createElement('a');
        clearBtn.className = 'searchbox';
        clearBtn.setAttribute('href', '');
        clearBtn.setAttribute('aria-label', 'Clear search');
        clearBtn.style.visibility = 'hidden';

        var input = document.createElement('input');
        input.className = 'searchbox';
        input.type = 'text';
        input.setAttribute('placeholder', hint);
        input.setAttribute('aria-label', 'Filter publications');

        form.appendChild(clearBtn);
        form.appendChild(input);
        filterForm.appendChild(form);

        // remember each field's original HTML so highlighting is reversible
        Array.prototype.forEach.call(filterList.children, function (li) {
            Array.prototype.forEach.call(li.querySelectorAll(PUB_FIELDS),
                function (el) { el.dataset.originalHtml = el.innerHTML; });
        });

        var timer = null;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                pubState.term = input.value.replace(/^\s+|\s+$/g, '');
                clearBtn.style.visibility = pubState.term ? 'visible' : 'hidden';
                pubRefresh();
            }, 220);
        });
        clearBtn.addEventListener('click', function (e) {
            e.preventDefault();
            input.value = '';
            input.focus();
            pubState.term = '';
            clearBtn.style.visibility = 'hidden';
            pubRefresh();
        });


    }

    /* ---- Publications: year filter chips ---- */
    var pubList = document.getElementById('filterlist');
    if (pubList && pubList.querySelector('.pubtitle')) {
        var years = {};
        Array.prototype.forEach.call(pubList.children, function (li) {
            var jEl = li.querySelector('.pub-year') || li.querySelector('.pubmeta');
            var m = jEl ? jEl.textContent.match(/\b(19|20)\d{2}\b/) : null;
            if (m) {
                li.setAttribute('data-year', m[0]);
                years[m[0]] = (years[m[0]] || 0) + 1;
            }
        });

        var chipsWrap = document.getElementById('year-chips');
        if (chipsWrap) {
            function applyFilter(year) {
                pubState.year = year;
                pubRefresh();
            }

            function makeChip(label, year) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'chip';
                b.textContent = year ? label + ' \u00b7 ' + years[year] : label;
                if (!year) b.classList.add('active');
                b.addEventListener('click', function () {
                    Array.prototype.forEach.call(chipsWrap.children, function (c) {
                        c.classList.remove('active');
                    });
                    b.classList.add('active');
                    applyFilter(year);
                });
                chipsWrap.appendChild(b);
            }

            makeChip('All years', null);
            Object.keys(years).sort().reverse().forEach(function (y) {
                makeChip(y, y);
            });
        }
    }
})();
