(function() {
    var namespace = 'FME';

    var scripts = ['web_resources/FME_exporter.js'];

    var i = 0;
    function loadScript() {
        if (scripts.length === 0) return;

        var scriptURL = chrome.extension.getURL(scripts.pop());
        console.log('Loading', scriptURL);
        var script = document.createElement('script');
        script.id = namespace + '-js-' + i++;
        script.type = 'text/javascript';
        script.src = scriptURL;

        script.onload = loadScript;
        script.onreadystatechange = function() {
            if (this.readyState === 'complete') loadScript();
        };

        document.body.appendChild(script);
    }
    loadScript();
})();
