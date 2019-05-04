(function () {
    const fleetManagerBaseUrl = 'https://fleet-manager.traefik.test'; // fleet.fallkrom.space

    function createExporterBlock() {
        const exporterBlockHtml = `
        <div id="FME-exporter-block" style="margin-top:20px;">
            <a class="shadow-button trans-02s trans-color" id="FME-exporter-submit">
                <span class="label js-label trans-02s">Export to Fleet Manager</span>
                <span class="icon trans-02s"></span>
                <span class="left-section"></span>
                <span class="right-section"></span>
            </a>
        </div>
    `;
        $('.sidenav').append(exporterBlockHtml);
    }

    const _manufacturerShortMap = {
        'ANVL': 'Anvil',
        'AEGS': 'Aegis',
        'AOPOA': 'Aopoa',
        'ARGO': 'Argo',
        'BANU': 'Banu',
        'CNOU': 'Consolidated',
        'CRSD': 'Crusader',
        'DRAK': 'Drake',
        'ESPERIA': 'Esperia',
        'KRGR': 'Kruger',
        'MISC': 'MISC',
        'ORIG': 'Origin',
        'RSI': 'RSI',
        'TMBL': 'Tumbril',
        'VANDUUL': 'Vanduul',
        'XIAN': 'Xi\'an',
    };

    let pledges = [];
    $('.list-items li').each((index, el) => {
        const $pledge = $(el);

        const $shipInfo = $pledge.find('.kind:contains(Ship)').parent();
        if ($shipInfo.length === 0) {
            return;
        }

        const pledge = {
            id: $('.js-pledge-id', $pledge).val(),
            name: $('.title', $shipInfo).text(),
            cost: $('.js-pledge-value', $pledge).val(),
            lti: $('.title:contains(Lifetime Insurance)', $pledge).length > 0,
            manufacturer: $('.liner span', $shipInfo).text(),
            pledge: $('.js-pledge-name', $pledge).val(),
            pledge_date: $('.date-col:first', $pledge).text().replace(/created:\s+/gi, '').trim(),
        };
        pledge.name = pledge.name.replace(/^\s*(?:Aegis|Anvil|Banu|Drake|Esperia|Kruger|MISC|Origin|RSI|Tumbril|Vanduul|Xi'an)[^a-z0-9]+/gi, '');
        pledge.name = pledge.name.replace(/^\s*(?:Aegis|Anvil|Banu|Drake|Esperia|Kruger|MISC|Origin|RSI|Tumbril|Vanduul|Xi'an)[^a-z0-9]+/gi, '');
        pledge.manufacturer = _manufacturerShortMap[pledge.manufacturer] || pledge.manufacturer;
        pledge.warbond = pledge.name.toLowerCase().indexOf('warbond') > -1;

        pledges.push(pledge);
    });
    createExporterBlock();

    async function retrieveApiToken() {
        const resp = await fetch(fleetManagerBaseUrl + '/me', {
            credentials: 'include'
        });
        if (!resp.ok) {
            console.error(`Unable to request ${resp.url}.`);
            return null;
        }
        if (resp.redirected && resp.url === fleetManagerBaseUrl + '/login/') {
            $('#FME-exporter-block').append(`<p id="FME-exporter-msg">We can't upload your fleet. Please login first at <a href="${fleetManagerBaseUrl}" target="_blank">${fleetManagerBaseUrl}</a>.</p>`);
            return null;
        }
        const json = await resp.json();

        return json.apiToken;
    }

    $('#FME-exporter-submit').on('click', async (ev) => {
        $('#FME-exporter-msg, #FME-exporter-success').remove();

        let apiToken = window.localStorage.getItem('apiToken');
        if (!apiToken) {
            apiToken = await retrieveApiToken();
            window.localStorage.setItem('apiToken', apiToken);
        }
        if (!apiToken) {
            return;
        }

        const resp = await fetch(fleetManagerBaseUrl+'/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+apiToken
            },
            body: JSON.stringify(pledges)
        });
        if (resp.ok) {
            $('#FME-exporter-block').append(`<p id="FME-exporter-success">Success!</p>`);
            return;
        }
        if (resp.status === 400) {
            const json = await resp.json();
            console.error(`An error has occurred. Error: ${json.error}.`);
            $('#FME-exporter-block').append(`<p id="FME-exporter-msg">An error has occurred, please retry. Error: ${json.error}.</p>`);
        } else if (resp.status === 403) {
            window.localStorage.removeItem('apiToken');
            $('#FME-exporter-block').append(`<p id="FME-exporter-msg">We can't upload your fleet. Please login first at <a href="${fleetManagerBaseUrl}" target="_blank">${fleetManagerBaseUrl}</a>.</p>`);
        }
    });
})();
