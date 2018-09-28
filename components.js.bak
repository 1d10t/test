AFRAME.registerComponent('transparent-texture', {
	
	init: function () {
		this.applyToMesh();
		var $this = this;
		this.el.addEventListener('model-loaded', function(){ return $this.applyToMesh(); });
	},
	
	applyToMesh: function() {
		const mesh = this.el.getObject3D('mesh');
		if (mesh)
			mesh.traverse( function( child ) {
				if ( child.isMesh )
				{
					child.material.transparent = true;
					child.material.alphaTest = 0.5;
				}
			});
	}
	
});


AFRAME.registerComponent('gps-position', {
	
	watchId: null,
	zeroCrd: null,
	crd: null,
	
	schema: {
		accuracy: {
			type: 'int',
			default: 100
		},
		'zero-crd-latitude': {
			type: 'number',
			default: NaN
		},
		'zero-crd-longitude': {
			type: 'number',
			default: NaN
		},
		'position-callback': {
			type: 'string',
			default: ''
		}
	},
	
	init: function () {
		
		if(!isNaN(this.data['zero-crd-latitude']) && !isNaN(this.data['zero-crd-longitude'])){
			this.zeroCrd = {latitude: this.data['zero-crd-latitude'], longitude: this.data['zero-crd-longitude']};
		}
		
		this.watchId = this.watchGPS(function(position){
			if(this.data['position-callback'].length)
				position = eval(this.data['position-callback'])(position);
			this.crd = position.coords;
			this.updatePosition();
		}.bind(this));
		
	},
	
	watchGPS: function (success, error) {
		
		if(typeof(error) == 'undefined')
			error = function(err) { console.warn('ERROR('+err.code+'): '+err.message); };
		
		if (!("geolocation" in navigator)){
			error({code: 0, message: 'Geolocation is not supported by your browser'});
			return;
		}
		
		return navigator.geolocation.watchPosition(success, error, {enableHighAccuracy: true, maximumAge: 0, timeout: 27000});
	},
	
	updatePosition: function () {
		
		if(this.crd.accuracy > this.data.accuracy) return;
		
		if(!this.zeroCrd) this.zeroCrd = this.crd;
		
		var p = this.el.getAttribute('position');
		
		p.x = this.calcMeters(
			this.zeroCrd,
			{
				longitude: this.crd.longitude,
				latitude: this.zeroCrd.latitude
			}
		) * (
			this.crd.longitude > this.zeroCrd.longitude
				? 1 : -1
		);
		p.z = this.calcMeters(
			this.zeroCrd,
			{
				longitude: this.zeroCrd.longitude,
				latitude: this.crd.latitude
			}
		) * (
			this.crd.latitude > this.zeroCrd.latitude
				? -1 : 1
		);
		
		this.el.setAttribute('position', p);
		
	},
	
	calcMeters: function(src, dest) {
		var dlon = THREE.Math.degToRad(dest.longitude - src.longitude);
		var dlat = THREE.Math.degToRad(dest.latitude - src.latitude);
		
		var a = (Math.sin(dlat / 2) * Math.sin(dlat / 2)) + Math.cos(THREE.Math.degToRad(src.latitude)) * Math.cos(THREE.Math.degToRad(dest.latitude)) * (Math.sin(dlon / 2) * Math.sin(dlon / 2));
		var angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		
		return angle * 6378160;
	},
	
	remove: function() {
		if(this.watchId) navigator.geolocation.clearWatch(this.watchId);
		this.watchId = null;
	}
	
});


AFRAME.registerComponent('compass-rotation', {
	
	lookControls: null,
	lastTimestamp: 0,
	heading: null,
	
	
	schema: {
		fixTime: {
			type: 'int',
			default: 2000
		},
		orientationEvent: {
			type: 'string',
			default: 'auto'
		}
	},
	
	init: function () {
		
		if(typeof(this.el.components['look-controls']) == 'undefined') return;
		
		this.lookControls = this.el.components['look-controls'];
		
		this.handlerOrientation = this.handlerOrientation.bind(this);
		
		if(this.data.orientationEvent == 'auto'){
			if('ondeviceorientationabsolute' in window){
				this.data.orientationEvent = 'deviceorientationabsolute';
			}else if('ondeviceorientation' in window){
				this.data.orientationEvent = 'deviceorientation';
			}else{
				this.data.orientationEvent = '';
				alert('Compass not supported');
				return;
			}
		}
		
		window.addEventListener(this.data.orientationEvent, this.handlerOrientation, false);
		
		window.addEventListener('compassneedscalibration', function(event) {
			alert('Your compass needs calibrating! Wave your device in a figure-eight motion');
			event.preventDefault();
		}, true);
		
	},
	
	tick: function (time, timeDelta) {
		
		if(this.heading === null
		|| this.lastTimestamp > (time - this.data.fixTime)) return;
		
		this.lastTimestamp = time;
		this.updateRotation();
		
	},
	
	calcCompassHeading: function (alpha, beta, gamma) {
		
		// Convert degrees to radians
		var alphaRad = alpha * (Math.PI / 180);
		var betaRad = beta * (Math.PI / 180);
		var gammaRad = gamma * (Math.PI / 180);
		
		// Calculate equation components
		var cA = Math.cos(alphaRad);
		var sA = Math.sin(alphaRad);
		var cB = Math.cos(betaRad);
		var sB = Math.sin(betaRad);
		var cG = Math.cos(gammaRad);
		var sG = Math.sin(gammaRad);
		
		// Calculate A, B, C rotation components
		var rA = - cA * sG - sA * sB * cG;
		var rB = - sA * sG + cA * sB * cG;
		var rC = - cB * cG;
		
		// Calculate compass heading
		var compassHeading = Math.atan(rA / rB);
		
		// Convert from half unit circle to whole unit circle
		if(rB < 0) {
			compassHeading += Math.PI;
		}else if(rA < 0) {
			compassHeading += 2 * Math.PI;
		}
		
		// Convert radians to degrees
		compassHeading *= 180 / Math.PI;
		
		return compassHeading;
	},
	
	handlerOrientation: function (evt) {
		
		var heading = null;
		
		console.log('device orientation event', evt);
		
		if(typeof(evt.webkitCompassHeading) != 'undefined'){
			
			if(evt.webkitCompassAccuracy < 50){
				heading = evt.webkitCompassHeading;
			}else{
				console.warn('webkitCompassAccuracy is evt.webkitCompassAccuracy');
			}
			
		}else if(evt.alpha !== null){
			if(evt.absolute === true || typeof(evt.absolute == 'undefined')) {
				heading = this.calcCompassHeading(evt.alpha, evt.beta, evt.gamma);
			}else{
				console.warn('evt.absolute === false');
			}
		}else{
			console.warn('evt.alpha === null');
		}
		
		this.heading = heading;
		
	},
	
	updateRotation: function() {
		
		/*
		camera.components["look-controls"].yawObject.rotation.y = THREE.Math.degToRad(
			(
				360
				- camera.components["compass-rotation"].heading
				- (
					camera.getAttribute('rotation').y
					- THREE.Math.radToDeg(camera.components["look-controls"].yawObject.rotation.y)
				)
			)
			% 360
		)
		*/
		
		
		var heading = 360 - this.heading
		var camera_rotation = this.el.getAttribute('rotation').y;
		var yaw_rotation = THREE.Math.radToDeg(this.lookControls.yawObject.rotation.y);
		
		var offset = ( heading - ( camera_rotation - yaw_rotation ) ) % 360;
		
		this.lookControls.yawObject.rotation.y = THREE.Math.degToRad(offset);
		
	},
	
	remove: function () {
		if(this.data.orientationEvent)
			window.removeEventListener(this.data.orientationEvent, this.handlerOrientation, false);
	}
	
});


AFRAME.registerComponent('gps-place', {
	
	cameraGpsPosition: null,
	deferredInitInterval: 0,
	
	schema: {
		latitude: {
			type: 'number',
			default: 0
		},
		longitude: {
			type: 'number',
			default: 0
		},
		cameraSelector: {
			type: 'string',
			default: 'a-camera, [camera]'
		}
	},
	
	init: function () {
		if(this.deferredInit()) return;
		this.deferredInitInterval = setInterval(this.deferredInit.bind(this), 1000);
	},
	
	deferredInit: function () {
		
		if(!this.cameraGpsPosition){
			var camera = document.querySelector(this.data.cameraSelector);
			if(typeof(camera.components['gps-position']) == 'undefined') return;
			this.cameraGpsPosition = camera.components['gps-position'];
		}
		
		if(!this.cameraGpsPosition.zeroCrd) return;
		
		this.updatePosition();
		
		clearInterval(this.deferredInitInterval);
		this.deferredInitInterval = 0;
		
		return true;
	},
	
	updatePosition: function() {
		
		var p = {x: 0, y: 0, z: 0};
		
		p.x = this.cameraGpsPosition.calcMeters(
			this.cameraGpsPosition.zeroCrd,
			{
				longitude: this.data.longitude,
				latitude: this.cameraGpsPosition.zeroCrd.latitude
			}
		) * (
			this.data.longitude > this.cameraGpsPosition.zeroCrd.longitude
				? 1 : -1
		);
		p.z = this.cameraGpsPosition.calcMeters(
			this.cameraGpsPosition.zeroCrd,
			{
				longitude: this.cameraGpsPosition.zeroCrd.longitude,
				latitude: this.data.latitude
			}
		) * (
			this.data.latitude > this.cameraGpsPosition.zeroCrd.latitude
				? -1 : 1
		);
		
		this.el.setAttribute('position', p);
		
	}
	
	
});

