'use strict';

(function ($) {
    if (!/[?&]debug(=|&|$)/.test(window.location.search)) {
        return;
    }

    window.MIRROR_DEBUG = true;

    function pad(n) { return String(n).padStart(2, '0'); }
    function dateStr(offsetDays) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    function isoStr(offsetHours) {
        const d = new Date();
        d.setHours(d.getHours() + offsetHours, 0, 0, 0);
        return d.toISOString();
    }

    const SAMPLE_IMAGE = 'https://i.imgur.com/pHhvGBE.png';

    const MOCKS = {
        'config.json': {
            'swedish-hockey': [{ name: 'LIF', image: SAMPLE_IMAGE }],
            weather: 'brastad',
            vasttrafik: {},
            calendar: [],
            coop: true,
            electricity: { region: 'SE3', markup: 2, grid_fee: 18.5, energy_tax: 43.9, include_vat: true },
        },
        '/checksum/': 'mirror-debug-checksum',
        'weather/': {
            now: { code: 'sunny', temperature: 18, high: 20, low: 12 },
            forecast: (() => {
                const codes = ['partly-cloudy-day', 'showers', 'cloudy', 'sunny', 'snow'];
                const out = {};
                for (let i = 1; i <= 5; i++) {
                    out[dateStr(i)] = { code: codes[i - 1], temperature: 14 + i, high: 18 + i, low: 8 + i };
                }
                return out;
            })(),
            warnings: [{
                id: 'demo-warning-1',
                levelCode: 'YELLOW',
                levelName: 'Gul',
                description: 'Kraftiga vindbyar väntas under eftermiddagen.',
                areaName: 'Bohuslän',
                approximateStart: isoStr(2),
                approximateEnd: isoStr(8),
            }],
        },
        'electricity/': {
            current: 1.23,
            high: 2.45,
            high_time: isoStr(4),
            low: 0.87,
            low_time: isoStr(-2),
            time_start: isoStr(0),
            time_end: isoStr(1),
        },
        'openings/': {
            [dateStr(0)]: [
                { title: 'Baksmedjan', time: '08-13', image: 'https://baksmedjan.se/logo.png' },
            ],
            [dateStr(1)]: [
                { title: 'Baksmedjan', time: '08-13', image: 'https://baksmedjan.se/logo.png' },
            ],
            [dateStr(6)]: [
                { title: 'Baksmedjan', time: '08-13', image: 'https://baksmedjan.se/logo.png' },
            ],
        },
        'portainer/': { up: 5, down: 1 },
        'vasttrafik/': {
            'demo-trip-1': {
                destination: 'Göteborg',
                route: [
                    { name: 'Brastad busstation', destination: 'Uddevalla' },
                    { name: 'Uddevalla C', destination: 'Göteborg' },
                ],
                ttl: ['07:42', '08:12', '08:42'],
            },
            'demo-trip-2': {
                destination: 'Göteborg',
                route: [{ name: 'Brastad busstation', destination: 'Göteborg' }],
                ttl: ['07:55', '08:25'],
            },
        },
        'calendar/': {
            [dateStr(0)]: [
                { image: SAMPLE_IMAGE, title: 'Tandläkare', time: '14:30' },
            ],
            [dateStr(1)]: [
                { image: SAMPLE_IMAGE, title: 'Föräldramöte', time: '18:00' },
            ],
        },
        'sonarr/': {
            [dateStr(0)]: [
                { image: SAMPLE_IMAGE, title: 'Severance S03E04', time: '20:00' },
            ],
            [dateStr(2)]: [
                { image: SAMPLE_IMAGE, title: 'Andor S02E08', time: '21:00' },
            ],
        },
        'swedish-hockey/': {
            [dateStr(1)]: [
                { image: SAMPLE_IMAGE, title: 'LIF vs MIF', time: '19:00' },
            ],
        },
        'coop/': { cash: 4321 },
    };

    // Each toggleable "feature" maps to one or more mocked URLs.
    // Keep `checksum` mocked so the page doesn't auto-reload mid-debug.
    const FEATURES = [
        { key: 'config',     label: 'config',        urls: ['config.json'] },
        { key: 'weather',    label: 'weather',       urls: ['weather/'] },
        { key: 'warnings',   label: 'smhi warning',  urls: [] },
        { key: 'electricity',label: 'electricity',   urls: ['electricity/'] },
        { key: 'openings',   label: 'openings',      urls: ['openings/'] },
        { key: 'portainer',  label: 'portainer',     urls: ['portainer/'] },
        { key: 'commute',    label: 'commute',       urls: ['vasttrafik/'] },
        { key: 'calendar',   label: 'calendar',      urls: ['calendar/'] },
        { key: 'sonarr',     label: 'sonarr',        urls: ['sonarr/'] },
        { key: 'hockey',     label: 'hockey',        urls: ['swedish-hockey/'] },
        { key: 'coop',       label: 'coop',          urls: ['coop/'] },
    ];

    const STORAGE_KEY = 'mirror-debug-disabled';

    function readDisabled() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return new Set(raw ? JSON.parse(raw) : []);
        } catch (e) {
            return new Set();
        }
    }

    function writeDisabled(set) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
        } catch (e) { /* ignore */ }
    }

    const disabled = readDisabled();

    // Apply disabled state: drop URLs from MOCKS so they fall through to the real backend.
    for (const feature of FEATURES) {
        if (!disabled.has(feature.key)) {
            continue;
        }
        for (const url of feature.urls) {
            delete MOCKS[url];
        }
    }
    if (disabled.has('warnings') && MOCKS['weather/']) {
        MOCKS['weather/'] = $.extend(true, {}, MOCKS['weather/'], { warnings: [] });
    }

    const originalAjax = $.ajax;
    $.ajax = function (settings) {
        const url = typeof settings === 'string' ? settings : (settings && settings.url);
        if (url && Object.prototype.hasOwnProperty.call(MOCKS, url)) {
            const payload = MOCKS[url];
            const dfd = $.Deferred();
            setTimeout(function () {
                dfd.resolveWith(this, [payload, 'success', {
                    status: 200,
                    statusText: 'OK',
                    responseText: typeof payload === 'string' ? payload : JSON.stringify(payload),
                    getResponseHeader: function () { return 'application/json'; },
                }]);
            }, 0);
            const promise = dfd.promise();
            promise.done = dfd.done.bind(dfd);
            promise.fail = dfd.fail.bind(dfd);
            promise.then = dfd.then.bind(dfd);
            promise.catch = dfd.then.bind(dfd, null);
            return promise;
        }
        return originalAjax.apply(this, arguments);
    };

    console.log('%c[mirror-debug] active — all backends mocked', 'color:#f80;font-weight:bold;');

    // ---- Toggle panel on the right edge ----

    function renderToggles() {
        const $panel = $(`
            <div class="debug-toggles">
                <div class="debug-toggles-head">
                    <span class="debug-toggles-title">DEBUG</span>
                    <button type="button" class="debug-toggles-all" data-action="all-on">all</button>
                    <button type="button" class="debug-toggles-all" data-action="all-off">none</button>
                </div>
                <ul class="debug-toggles-list"></ul>
                <div class="debug-toggles-foot">
                    <a href="${window.location.pathname}">exit debug</a>
                </div>
            </div>
        `);

        const $list = $panel.find('.debug-toggles-list');
        for (const feature of FEATURES) {
            const isOn = !disabled.has(feature.key);
            const $row = $(`
                <li>
                    <label>
                        <input type="checkbox" data-key="${feature.key}" ${isOn ? 'checked' : ''}>
                        <span>${feature.label}</span>
                    </label>
                </li>
            `);
            $list.append($row);
        }

        $panel.on('change', 'input[type="checkbox"]', function () {
            const key = $(this).data('key');
            if (this.checked) {
                disabled.delete(key);
            } else {
                disabled.add(key);
            }
            writeDisabled(disabled);
            window.location.reload();
        });

        $panel.on('click', '.debug-toggles-all', function () {
            const action = $(this).data('action');
            if (action === 'all-on') {
                writeDisabled(new Set());
            } else {
                writeDisabled(new Set(FEATURES.map(f => f.key)));
            }
            window.location.reload();
        });

        $('body').append($panel);
    }

    const css = `
        .debug-toggles {
            background: rgba(20, 20, 20, 0.92);
            border: 1px solid #444;
            border-radius: 4px;
            color: #ddd;
            font-family: 'B612 Mono', monospace;
            font-size: 11px;
            padding: 8px 10px;
            position: fixed;
            right: 6px;
            top: 60px;
            width: 150px;
            z-index: 9999;
            cursor: auto;
        }
        .debug-toggles-head {
            align-items: center;
            border-bottom: 1px solid #333;
            display: flex;
            gap: 4px;
            padding-bottom: 6px;
            margin-bottom: 6px;
        }
        .debug-toggles-title {
            color: #f80;
            flex: 1;
            font-weight: 700;
            letter-spacing: 0.15em;
        }
        .debug-toggles-all {
            background: #222;
            border: 1px solid #444;
            border-radius: 2px;
            color: #aaa;
            cursor: pointer;
            font: inherit;
            font-size: 9px;
            padding: 1px 4px;
            text-transform: uppercase;
        }
        .debug-toggles-all:hover { color: #fff; border-color: #888; }
        .debug-toggles-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        .debug-toggles-list li { margin: 2px 0; }
        .debug-toggles-list label {
            align-items: center;
            cursor: pointer;
            display: flex;
            gap: 6px;
            line-height: 1.4;
        }
        .debug-toggles-list input[type="checkbox"] {
            accent-color: #f80;
            cursor: pointer;
            margin: 0;
        }
        .debug-toggles-list span { user-select: none; }
        .debug-toggles-foot {
            border-top: 1px solid #333;
            margin-top: 6px;
            padding-top: 6px;
            text-align: right;
        }
        .debug-toggles-foot a {
            color: #888;
            font-size: 10px;
            text-decoration: none;
            text-transform: uppercase;
        }
        .debug-toggles-foot a:hover { color: #fff; }
    `;

    $('<style>').text(css).appendTo('head');
    $(renderToggles);
})(jQuery);
