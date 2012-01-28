function JSSpeccy(container, opts) {
	if (typeof(container) === 'string') {
		container = document.getElementById(container);
	}
	if (!opts) {
		opts = {};
	}
	
	var controller = {};
	controller.reset = function() {
		spectrum.reset();
	}
	controller.loadFile = function(name, data) {
		if ( name.match(/\.sna$/) ) {
			 var snapshot = JSSpeccy.loadSna(data);
			 spectrum = JSSpeccy.Spectrum({
				ui: ui,
				keyboard: keyboard,
				model: snapshot.model
			 });
			 spectrum.loadSnapshot(snapshot);
		}
	}
	
	var ui = JSSpeccy.UI({
		container: container,
		controller: controller,
		scaleFactor: opts.scaleFactor || 2
	});
	
	var keyboard = JSSpeccy.Keyboard();
	
	var spectrum = JSSpeccy.Spectrum({
		ui: ui,
		keyboard: keyboard,
		model: JSSpeccy.Spectrum.MODEL_128K
	})
	
	controller.isRunning = false;
	
	function tick() {
		if (!controller.isRunning) return;
		spectrum.runFrame();
		setTimeout(tick, 20);
	}
	
	controller.start = function() {
		controller.isRunning = true;
		tick();
	}
	controller.stop = function() {
		controller.isRunning = false;
	}
	if (!('autostart' in opts) || opts['autostart']) {
		controller.start();
	}
	if ('file' in opts) {
        var self = this;
        $.ajax({
            url: escape(opts['file']),
            xhr: function() {
                var xhr = $.ajaxSettings.xhr();
                if (typeof xhr.overrideMimeType !== 'undefined') {
                    // Download as binary
                    xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                self.xhr = xhr;
                return xhr;
            },
            complete: function(xhr, status) {
                var i, data;
                // if (IE) {
                //     var charCodes = JSNESBinaryToArray(
                //         xhr.responseBody
                //     ).toArray();
                //     data = String.fromCharCode.apply(
                //         undefined, 
                //         charCodes
                //     );
                // }
                // else {
                    data = xhr.responseText;
                // }
                controller.loadFile(opts['file'], data);
            }
        });
	}
}
