function createExporterBlock()
{
    exporterBlockHtml = `
        <div id="FME-exporter-block" style="margin-top:20px;">
            <input type="text" id="FME-exporter-token" value="" placeholder="Fleet manager Token" />
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

var _manufacturerShortMap = {
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

var pledges = [];
$('.list-items li').each((index, el) => {
    var $pledge = $(el);

    $shipInfo = $pledge.find('.kind:contains(Ship)').parent();
    if ($shipInfo.length === 0) {
        return;
    }

    var pledge = {
        id: $('.js-pledge-id', $pledge).val(),
        name: $('.title', $shipInfo).text(),
        cost: $('.js-pledge-value', $pledge).val(),
        lti: $('.title:contains(Lifetime Insurance)', $pledge).length > 0,
        manufacturer: $('.liner span', $shipInfo).text(),
        pledge: $('.js-pledge-name', $pledge).val(),
        pledge_date: $('.date-col:first', $pledge).text().replace(/created:\s+/gi, '').trim(),
    };
    pledge.manufacturer = _manufacturerShortMap[pledge.manufacturer] || pledge.manufacturer;
    pledge.warbond = pledge.name.toLowerCase().indexOf('warbond') > -1;

    pledges.push(pledge);
});

createExporterBlock();
$('#FME-exporter-submit').on('click', (ev) => {
    console.log(pledges);

    fetch('https://fleet.fallkrom.space/api/export', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+$('#FME-exporter-token').val()
        },
        body: JSON.stringify({pledges})
    })
    .then(response => response.json())
    .then(json => {
        console.log(json);
    });
});
