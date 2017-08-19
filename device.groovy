preferences {
    input("cloudFnUrl", "text", title: "Cloud Function URL")
	input("cloudFnToken", "text", title: "Encrypted access token")
	input("cloudFnOnCmd", "text", title: "Command name for ON")
	input("cloudFnOffCmd", "text", title: "Command name for OFF")
}
 
 // for the UI
metadata {
	definition (name: "Cloud Function Executor", author: "dan.isla@gmail.com") {
    	capability "Switch"
	}

    // tile definitions
	tiles {
		standardTile("switch", "device.switch", width: 2, height: 2, canChangeIcon: true) {
		state "on", label: '${name}', action: "switch.off", icon: "st.switches.switch.on", backgroundColor: "#79b821"
		state "off", label: '${name}', action: "switch.on", icon: "st.switches.switch.off", backgroundColor: "#ffffff"
		}

		main "switch"
		details "switch"
	}
}

def parse(String description) {
	log.error "This device does not support incoming events"
	return null
}

def on() {
	gcf cloudFnOnCmd
    sendEvent(name: 'switch', value: 'on')
}

def off() {
	gcf cloudFnOffCmd
    sendEvent(name: 'switch', value: 'off')
}

private gcf(cmd) {
    // Cloud Function call
	httpPost(
		uri: cloudFnUrl,
        body: [
			token: cloudFnToken,
			cmd: cmd
		],
	) {response -> log.debug (response.data)}
}