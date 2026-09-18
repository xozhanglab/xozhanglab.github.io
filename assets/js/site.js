/* Site interactions: mobile nav, typewriter, scroll reveal, card expand,
   publication filters, hero spotlight, card 3D tilt, progress bar,
   back-to-top and the shrinking header. */
(function () {
    'use strict';

    /* head.html hides [data-reveal] content as soon as the "js" class is set,
       so it has to be told the opposite: an inline fail-safe there reveals
       everything if this file never runs. That marker is added first, before
       anything below can throw. */
    document.documentElement.classList.add('js-ready');

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Mobile navigation ---- */
    var navToggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('menu');

    function closeNav() {
        if (!document.body.classList.contains('nav-open')) return;
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
    }

    if (navToggle && menu) {
        navToggle.addEventListener('click', function () {
            var open = document.body.classList.toggle('nav-open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        menu.addEventListener('click', function (e) {
            if (e.target && e.target.tagName === 'A') closeNav();
        });
        // Escape and an outside click both close the menu: on a phone the
        // only other way out is hitting the toggle again or a nav link.
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape' && e.key !== 'Esc') return;
            if (!document.body.classList.contains('nav-open')) return;
            closeNav();
            navToggle.focus();
        });
        document.addEventListener('click', function (e) {
            if (!document.body.classList.contains('nav-open')) return;
            var t = e.target;
            if (t && t.closest && t.closest('#navbar')) return;
            closeNav();
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

    /* Search used to run against each field's serialized HTML, so a term like
       "sup", "doi" or "hot" matched a tag name or a class attribute and got
       wrapped as a highlight, producing invalid markup. Matching walks text
       nodes only, which also makes "did this field match?" agree with what a
       reader actually sees. */
    function eachTextNode(root, fn) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var node;
        while ((node = walker.nextNode())) {
            if (fn(node) === false) return;
        }
    }

    function textMatches(el, regex) {
        var found = false;
        eachTextNode(el, function (node) {
            regex.lastIndex = 0;
            if (regex.test(node.nodeValue)) { found = true; return false; }
        });
        return found;
    }

    function highlightText(el, regex) {
        var nodes = [];
        eachTextNode(el, function (node) {
            regex.lastIndex = 0;
            if (regex.test(node.nodeValue)) nodes.push(node);
        });
        if (!nodes.length) return false;
        nodes.forEach(function (node) {
            var text = node.nodeValue;
            var frag = document.createDocumentFragment();
            var last = 0, m;
            regex.lastIndex = 0;
            while ((m = regex.exec(text)) !== null) {
                if (!m[0].length) { regex.lastIndex++; continue; }
                if (m.index > last) {
                    frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                }
                var mark = document.createElement('span');
                mark.className = 'highlight';
                mark.textContent = m[0];
                frag.appendChild(mark);
                last = m.index + m[0].length;
            }
            if (last < text.length) {
                frag.appendChild(document.createTextNode(text.slice(last)));
            }
            node.parentNode.replaceChild(frag, node);
        });
        return true;
    }

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
        var hits = 0;

        Array.prototype.forEach.call(items, function (li) {
            var matched = false;
            var absHit = false;
            var abs = li.querySelector('.pubabstract');

            Array.prototype.forEach.call(li.querySelectorAll(PUB_FIELDS),
                function (el) {
                    // restore the saved markup first: the previous pass may
                    // have wrapped matches in <span class="highlight">
                    if (el.dataset.originalHtml !== undefined) {
                        el.innerHTML = el.dataset.originalHtml;
                    }
                    if (!plain) return;
                    if (!textMatches(el, plain)) return;
                    matched = true;
                    if (el === abs) absHit = true;
                    highlightText(el, plain);
                });

            var yearOk = !pubState.year || li.getAttribute('data-year') === pubState.year;
            var show = yearOk && (!term || matched);
            li.style.display = show ? '' : 'none';
            if (show) hits++;

            if (abs) {
                // An abstract opens when the term matched inside it, that is
                // the only place the hit could be seen, or when the reader
                // opened it by hand. Expanding every card whose *title*
                // matched buried the matched titles under 30 panels.
                var manual = li.getAttribute('data-abs-open') === '1';
                abs.style.display = (show && (absHit || manual)) ? 'block' : 'none';
            }
        });

        var emptyEl = document.getElementById('pub-empty');
        if (emptyEl) {
            var showEmpty = hits === 0 && (term || pubState.year);
            emptyEl.hidden = !showEmpty;
            if (showEmpty) {
                emptyEl.textContent = 'No papers match' +
                    (term ? ' "' + term + '"' : '') +
                    (pubState.year ? ' in ' + pubState.year : '') + '. ';
                // The old copy told the reader to clear the filters without
                // giving them anything to click.
                var reset = document.createElement('button');
                reset.type = 'button';
                reset.className = 'pub-empty-reset';
                reset.textContent = 'Clear all filters';
                reset.addEventListener('click', resetFilters);
                emptyEl.appendChild(reset);
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

    function resetFilters() {
        pubState.year = null;
        pubState.term = '';
        if (filterInputEl) {
            filterInputEl.value = '';
            filterInputEl.focus();
        }
        if (clearBtnEl) clearBtnEl.hidden = true;
        Array.prototype.forEach.call(
            document.querySelectorAll('#year-chips .chip'),
            function (c) {
                var on = c.getAttribute('data-year') === '';
                c.classList.toggle('active', on);
                c.setAttribute('aria-pressed', on ? 'true' : 'false');
            }
        );
        pubRefresh();
    }

    var filterInputEl = null;
    var clearBtnEl = null;

    if (filterForm && filterList && filterList.querySelector('.pubtitle')) {
        var hint = window.innerWidth < 560
            ? 'Filter by keyword ...'
            : "Filter by keyword ... (e.g. 'TE')";

        var form = document.createElement('form');
        form.className = 'searchbox';
        form.setAttribute('role', 'search');

        // A form with one text input submits on Enter; with no action that
        // reloads the page (or jumps to "#") and silently drops the filters.
        form.addEventListener('submit', function (e) { e.preventDefault(); });

        var clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'searchbox';
        clearBtn.setAttribute('aria-label', 'Clear search');
        clearBtn.hidden = true;

        var input = document.createElement('input');
        input.className = 'searchbox';
        input.type = 'search';
        input.setAttribute('placeholder', hint);
        input.setAttribute('aria-label', 'Filter publications');
        input.setAttribute('autocomplete', 'off');

        form.appendChild(clearBtn);
        form.appendChild(input);
        filterForm.appendChild(form);

        filterInputEl = input;
        clearBtnEl = clearBtn;

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
                clearBtn.hidden = !pubState.term;
                pubRefresh();
            }, 220);
        });
        clearBtn.addEventListener('click', function () {
            input.value = '';
            input.focus();
            pubState.term = '';
            clearBtn.hidden = true;
            pubRefresh();
        });

        // clicking a paper toggles its abstract
        Array.prototype.forEach.call(filterList.children, function (li) {
            li.addEventListener('click', function (e) {
                if (e.target.closest('a')) return;   // let links work normally
                var abs = li.querySelector('.pubabstract');
                if (!abs || !abs.textContent.trim()) return;
                li.setAttribute('data-abs-open',
                    li.getAttribute('data-abs-open') === '1' ? '0' : '1');
                pubRefresh();
            });
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

            // ".active" carries the styling and aria-pressed carries the
            // state; flipping them together keeps the two from drifting, and
            // gives screen readers the selected year the colour conveys.
            function setActiveChip(chip) {
                Array.prototype.forEach.call(chipsWrap.children, function (c) {
                    var on = c === chip;
                    c.classList.toggle('active', on);
                    c.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
            }

            var yearTotal = Object.keys(years).reduce(function (n, y) {
                return n + years[y];
            }, 0);

            function makeChip(label, year) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'chip';
                b.setAttribute('data-year', year || '');
                // "All years" was the only chip without a count
                b.textContent = label + ' \u00b7 ' + (year ? years[year] : yearTotal);
                b.setAttribute('aria-pressed', year ? 'false' : 'true');
                if (!year) b.classList.add('active');
                b.addEventListener('click', function () {
                    setActiveChip(b);
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

    /* ---- Alumni disclosure ----
       The heading used to be an <h2 onclick> with no role, no tabindex and
       the table hidden by an inline style, so it was unreachable by keyboard
       and its content vanished entirely without JS. */
    var alumniBtn = document.getElementById('alumni-toggle');
    var alumniTable = document.getElementById('alumni-table');
    if (alumniBtn && alumniTable) {
        alumniBtn.addEventListener('click', function () {
            var open = alumniTable.classList.toggle('is-open');
            alumniBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }
})();
