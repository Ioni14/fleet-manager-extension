$(function () {
    'use strict';
    const fleetManagerBaseUrl = 'https://fleet-manager.space';
    const cookiesDomain = 'fleet-manager.space';
    const version = '1.0.8';

    let pledges = [];
    let marginTop = 20;
    const placeBlock = function() {
        marginTop = ($('#billing .js-bulk-ui').length > 0 && $(window).width() < 1680) ? 190 : 20;
        $('#FME-exporter-block').css('margin-top', `${marginTop}px`);
    };
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const observer = new MutationObserver((mutationsList, observer) => {
        placeBlock();
    });
    observer.observe(document.getElementById('billing'), { childList: true });
    $(window).on('resize', (ev) => {
        placeBlock();
    });

    const displayVersionComparison = function(json) {
        $('#FME-need-upgrade-msg').html('');
        if (json.needUpgradeVersion) {
            $('#FME-need-upgrade-msg').html(`Your plugin version ${json.requestExtensionVersion ? '('+json.requestExtensionVersion+')' : ''}) is not the last one. Consider upgrading to ${json.lastVersion}: <a style="color: #20dbdc" href="https://ext.fleet-manager.space/fleet_manager_extension-latest.xpi">Firefox</a> or <a style="color: #20dbdc" target="_blank" href="https://chrome.google.com/webstore/detail/fleet-manager-extension/hbbadomkekhkhemjjmhkhgiokjhpobhk">Chrome</a>.`);
        }
    };

    const createExporterBlock = function () {
        $('#FME-exporter-block').remove();
        $('#FME-exporter-block-download-json').remove();

        const exporterBlockHtml = `
            <div id="FME-exporter-block" style="margin-top:${marginTop}px;">
                <a class="shadow-button trans-02s trans-color" id="FME-exporter-submit" style="width: 140px;">
                    <span class="label js-label trans-02s">Export to Fleet Manager</span>
                    <span class="icon trans-02s"></span>
                    <span class="left-section"></span>
                    <span class="right-section"></span>
                </a>
                <p id="FME-exporter-msg" style="
                    color: #6c84a2;
                    font-size: 12px;
                    text-transform: uppercase;
                    font-family: 'Electrolize', sans-serif;
                    display: inline-block;
                    padding-left: 4px;
                "></p>
                <p id="FME-need-upgrade-msg" style="
                    color: #d59347;
                    font-size: 12px;
                    text-transform: uppercase;
                    font-family: 'Electrolize', sans-serif;
                    display: inline-block;
                    padding-left: 4px;
                "></p>
            </div>
            <div id="FME-exporter-block-download-json" style="margin-top:10px;">
                <a class="shadow-button trans-02s trans-color" id="FME-exporter-download-json" style="width: 140px;">
                    <span class="label js-label trans-02s">Export JSON file</span>
                    <span class="icon trans-02s"></span>
                    <span class="left-section"></span>
                    <span class="right-section"></span>
                </a>
                <p id="FME-exporter-download-json-msg" style="
                    color: #6c84a2;
                    font-size: 12px;
                    text-transform: uppercase;
                    font-family: 'Electrolize', sans-serif;
                    display: inline-block;
                    padding-left: 4px;
                "></p>
            </div>
        `;
        $('.sidenav').append(exporterBlockHtml);

        $('#FME-exporter-download-json').on('click', async (ev) => {
            ev.preventDefault();
            const $exporterMsg = $('#FME-exporter-download-json-msg');
            $exporterMsg.html('');

            const $download = $('<a/>');
            $download.hide();
            $(document.body).append($download);
            $download.attr('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pledges, null, 2)));
            $download.attr('download', 'starcitizen-fleet.json');
            $download.attr('type', 'application/json');
            $download[0].click();
        });
        $('#FME-exporter-submit').on('click', async (ev) => {
            ev.preventDefault();
            const $exporterMsg = $('#FME-exporter-msg');
            $exporterMsg.html('');

            let apiToken = window.localStorage.getItem('apiToken');
            if (!apiToken || apiToken === 'null') {
                window.localStorage.removeItem('apiToken');
                apiToken = await retrieveApiToken();
                if (apiToken) {
                    window.localStorage.setItem('apiToken', apiToken);
                }
            }
            if (!apiToken) {
                return;
            }

            $exporterMsg.html(`Uploading...`);
            const resp = await fetch(fleetManagerBaseUrl + '/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiToken,
                    'X-FME-Version': version,
                },
                body: JSON.stringify(pledges)
            });

            if (resp.ok) {
                $exporterMsg.html(`<span style="color: #0f0;">Success!</span> <a style="color: #20dbdc" target="_blank" href="${fleetManagerBaseUrl}/my-fleet/">Go to your fleet</a>.`);
                if (resp.status === 200) {
                    const json = await resp.json();
                    displayVersionComparison(json);
                }
                return;
            }
            if (resp.status === 400) {
                const json = await resp.json();
                displayVersionComparison(json);
                console.error(`An error has occurred. Error: ${json.error}.`);

                let errorHtml = '';
                switch (json.error) {
                    case 'no_citizen_created':
                        errorHtml = `Your RSI account must be linked first. Go to the <a style="color: #20dbdc" target="_blank" href="${fleetManagerBaseUrl}/profile/">profile page</a>.`;
                        break;
                    case 'uploaded_too_close':
                        errorHtml = `Your fleet has been uploaded recently. Please wait a few minutes before re-uploading.`;
                        break;
                    case 'not_found_handle':
                        errorHtml = `The SC handle ${json.context.handle} does not exist. Please check the typo.`;
                        break;
                    case 'bad_citizen':
                        errorHtml = `Your SC handle has probably changed. Please update it in <a style="color: #20dbdc" target="_blank" href="${fleetManagerBaseUrl}/profile/">your Profile</a>.`;
                        break;
                    case 'invalid_fleet_data':
                    case 'bad_json':
                    case 'cannot_handle_file':
                        errorHtml = `An error has occurred, please retry. If this error persists, you can <a style="color: #20dbdc" href="https://github.com/Ioni14/fleet-manager-extension/issues">post an issue on the repo</a> to help us to resolve it.`;
                        break;
                }
                $exporterMsg.html(errorHtml);
            } else if (resp.status === 403) {
                window.localStorage.removeItem('apiToken');
                $exporterMsg.html(`We can't upload your fleet. Please login first at <a style="color: #20dbdc" href="${fleetManagerBaseUrl}" target="_blank">${fleetManagerBaseUrl}</a>.`);
            } else {
                $exporterMsg.html(`An error has occurred, please retry. If this error persists, you can <a style="color: #20dbdc" href="https://github.com/Ioni14/fleet-manager-extension/issues">post an issue on the repo</a> to help us to resolve it.`);
            }
        });
    };

    const retrieveApiToken = async function () {
        const resp = await fetch(fleetManagerBaseUrl + '/api/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-FME-Version': version,
            },
            credentials: 'include'
        });
        if (resp.ok) {
            const json = await resp.json();
            displayVersionComparison(json);
            return json.apiToken;
        }
        if (resp.status === 401 || resp.status === 403) {
            $('#FME-exporter-msg').html(`We can't upload your fleet. Please login first at <a href="${fleetManagerBaseUrl}" target="_blank">${fleetManagerBaseUrl}</a>.<br/>If you are logged and this error persists, authorize the cookies for "${cookiesDomain}".`);
        } else {
            $('#FME-exporter-msg').html(`Unable to request Fleet Manager, please retry. If this error persists, you can <a href="https://github.com/Ioni14/fleet-manager-extension/issues">post an issue on the repo</a> to help us to resolve it.`);
        }

        return null;
    };

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
        'GRIN': 'Greycat Industrial',
        'KRGR': 'Kruger',
        'MISC': 'MISC',
        'ORIG': 'Origin',
        'RSI': 'RSI',
        'TMBL': 'Tumbril',
        'VANDUUL': 'Vanduul',
        'XIAN': 'Xi\'an',
    };

    const createPledge = function ($pledge, $shipInfo, insuranceType, insuranceMonths) {
        let cost = null;
        const pledgeValue = $('.js-pledge-value', $pledge).val().trim();
        if (/^\$/.exec(pledgeValue)) {
            cost = pledgeValue;
        }   

        const pledge = {
            name: $('.title', $shipInfo).text(),
            manufacturer: $('.liner span', $shipInfo).text(),
            id: $('.js-pledge-id', $pledge).val(),
            cost: cost,
            lti: (insuranceType == "lti"),
            iae: (insuranceType == "iae"),
            monthsInsurance: insuranceMonths,
            package_id: $('.js-pledge-id', $pledge).val(),
            pledge: $('.js-pledge-name', $pledge).val(),
            pledge_date: $('.date-col:first', $pledge).text().replace(/created:\s+/gi, '').trim(),
            is_upgrade: false,
            upgrade_from: null
        };
        
        const upgradeRegexResult = /^(.+)\sto\s(.+)\sUpgrade$/i.exec(pledge.name);
        if (upgradeRegexResult !== null) {
            pledge.name = upgradeRegexResult[2];
            pledge.is_upgrade = true;
            pledge.upgrade_from = upgradeRegexResult[1];
        }     
        
        pledge.name = pledge.name.replace(/^\s*(?:Aegis|Anvil|Banu|Drake|Esperia|Kruger|MISC|Origin|RSI|Tumbril|Vanduul|Xi'an)[^a-z0-9]+/gi, '');
        pledge.manufacturer = _manufacturerShortMap[pledge.manufacturer] || pledge.manufacturer;
        pledge.warbond = pledge.pledge.toLowerCase().indexOf('warbond') !== -1;

        return pledge;
    };

    const process = function (body) {
        $('.list-items li', body).each((index, el) => {
            const $pledge = $(el);

            let insuranceType = null;
            let insuranceMonths = null;

            $pledge.find('.without-images .item .title').each((i, elBonus) => {
                const bonus = $(elBonus).text().trim();
                
                if (/Lifetime\s+Insurance/i.test(bonus)) {
                    insuranceType = "lti";
                    
                } else if (/IAE\s+Insurance/i.test(bonus)) {
                    insuranceType = "iae";
                    insuranceMonths = 120;
                    
                } else {
                    const insuranceRegexResult = /(\d+)(\s+|-)Months?\s+Insurance/i.exec(bonus);
                    
                    if (insuranceRegexResult !== null && insuranceRegexResult[1]) {
                        insuranceMonths = parseInt(insuranceRegexResult[1]);           
                        
                        if (insuranceMonths > 0) {
                            insuranceType = "monthly";
                        }
                    }         
                }
            });

            $('.items .item', $pledge).each((indexItem, elItem) => {
                const $item = $(elItem);

                // upgrade
                let $shipInfo = $item.find('.title:contains(Upgrade)').parent();
                if ($shipInfo.length !== 0) {
                    if (/Best\sin\sShow\sLivery\sUpgrade/i.test($('.title', $shipInfo).text())) {
                        return;
                    }
                    
                    pledges.push(createPledge($pledge, $shipInfo, null, null));
                    return;
                }

                // special cases
                $shipInfo = $item.find('.kind:contains(Hangar decoration)').parent();
                if ($shipInfo.length !== 0) {
                    if ($('.liner', $shipInfo).text().indexOf('Greycat Industrial') !== -1
                        && $('.title', $shipInfo).text().indexOf('Greycat PTV') !== -1) {

                        // Found the ship "Greycat PTV" from "Greycat Industrial"
                        const pledge = createPledge($pledge, $shipInfo, insuranceType, insuranceMonths);

                        pledges.push(pledge);
                    }
                    return;
                }

                $shipInfo = $item.find('.kind:contains(Ship)').parent();
                if ($shipInfo.length === 0) {
                    return;
                }

                const pledge = createPledge($pledge, $shipInfo, insuranceType, insuranceMonths);

                pledges.push(pledge);
            });
        });
    };

    const loadPage = function (page) {
        const url = `/account/pledges?page=${page}&pagesize=100`;
        const $page = $('<div>');
        $page.load(url + ' .page-wrapper', function (response, status) {
            if ($('.list-items .empy-list', this).length > 0) {
                createExporterBlock();
                return;
            }
            if (status === "success") {
                process(this);
            } else {
                $('.sidenav').append('Error loading your pledges. You can <a href="https://github.com/Ioni14/fleet-manager-extension/issues">post an issue on the repo</a> to help us.');
            }
            loadPage(page+1);
        });
    };
    loadPage(1);
});
