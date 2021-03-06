JSSpeccy.IOBus = function(opts) {
	var self = {};
	
	var keyboard = opts.keyboard;
	var display = opts.display;
	var memory = opts.memory;
	
	self.read = function(addr) {
		if ((addr & 0x0001) == 0x0000) {
			return keyboard.poll(addr);
		} else if ((addr & 0x00e0) == 0x0000) {
			/* kempston joystick */
			return 0;
		} else {
			return 0xff;
		}
	}
	self.write = function(addr, val) {
		if (!(addr & 0x01)) {
			display.setBorder(val & 0x07);
		}
		if (!(addr & 0x8002)) {
			memory.setPaging(val);
		}
	}
	
	return self;
}
