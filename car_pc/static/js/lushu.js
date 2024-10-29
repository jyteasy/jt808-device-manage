var BMapGLLib = window.BMapGLLib = BMapGLLib || {};
(function() {
	var e;
	var b = e = b || {
		version: "gl 1.0"
	};
	b.guid = "$BAIDU$";
	(function() {
		window[b.guid] = window[b.guid] || {};
		b.dom = b.dom || {};
		b.dom.g = function(k) {
			if ("string" == typeof k || k instanceof String) {
				return document.getElementById(k)
			} else {
				if (k && k.nodeName && (k.nodeType == 1 || k.nodeType == 9)) {
					return k
				}
			}
			return null
		};
		b.g = b.G = b.dom.g;
		b.lang = b.lang || {};
		b.lang.isString = function(k) {
			return "[object String]" == Object.prototype.toString.call(k)
		};
		b.isString = b.lang.isString;
		b.dom._g = function(k) {
			if (b.lang.isString(k)) {
				return document.getElementById(k)
			}
			return k
		};
		b._g = b.dom._g;
		b.dom.getDocument = function(k) {
			k = b.dom.g(k);
			return k.nodeType == 9 ? k : k.ownerDocument || k.document
		};
		b.browser = b.browser || {};
		b.browser.ie = b.ie = /msie (\d+\.\d+)/i.test(navigator.userAgent) ? (document.documentMode || +RegExp["\x241"]) : undefined;
		b.dom.getComputedStyle = function(l, k) {
			l = b.dom._g(l);
			var n = b.dom.getDocument(l),
				m;
			if (n.defaultView && n.defaultView.getComputedStyle) {
				m = n.defaultView.getComputedStyle(l, null);
				if (m) {
					return m[k] || m.getPropertyValue(k)
				}
			}
			return ""
		};
		b.dom._styleFixer = b.dom._styleFixer || {};
		b.dom._styleFilter = b.dom._styleFilter || [];
		b.dom._styleFilter.filter = function(l, o, p) {
			var n = b.dom._styleFilter;
			var m;
			for (var k = 0; m = n[k]; k++) {
				if (m = m[p]) {
					o = m(l, o)
				}
			}
			return o
		};
		b.string = b.string || {};
		b.string.toCamelCase = function(k) {
			if (k.indexOf("-") < 0 && k.indexOf("_") < 0) {
				return k
			}
			return k.replace(/[-_][^-_]/g, function(l) {
				return l.charAt(1).toUpperCase()
			})
		};
		b.dom.getStyle = function(m, l) {
			var o = b.dom;
			m = o.g(m);
			l = b.string.toCamelCase(l);
			var n = m.style[l] || (m.currentStyle ? m.currentStyle[l] : "") || o.getComputedStyle(m, l);
			if (!n) {
				var k = o._styleFixer[l];
				if (k) {
					n = k.get ? k.get(m) : b.dom.getStyle(m, k)
				}
			}
			if (k = o._styleFilter) {
				n = k.filter(l, n, "get")
			}
			return n
		};
		b.getStyle = b.dom.getStyle;
		b.dom._NAME_ATTRS = (function() {
			var k = {
				"cellpadding": "cellPadding",
				"cellspacing": "cellSpacing",
				"colspan": "colSpan",
				"rowspan": "rowSpan",
				"valign": "vAlign",
				"usemap": "useMap",
				"frameborder": "frameBorder"
			};
			if (b.browser.ie < 8) {
				k["for"] = "htmlFor";
				k["class"] = "className"
			} else {
				k["htmlFor"] = "for";
				k["className"] = "class"
			}
			return k
		})();
		b.dom.setAttr = function(l, k, m) {
			l = b.dom.g(l);
			if ("style" == k) {
				l.style.cssText = m
			} else {
				k = b.dom._NAME_ATTRS[k] || k;
				l.setAttribute(k, m)
			}
			return l
		};
		b.setAttr = b.dom.setAttr;
		b.dom.setAttrs = function(m, k) {
			m = b.dom.g(m);
			for (var l in k) {
				b.dom.setAttr(m, l, k[l])
			}
			return m
		};
		b.setAttrs = b.dom.setAttrs;
		b.dom.create = function(m, k) {
			var n = document.createElement(m),
				l = k || {};
			return b.dom.setAttrs(n, l)
		};
		b.object = b.object || {};
		b.extend = b.object.extend = function(m, k) {
			for (var l in k) {
				if (k.hasOwnProperty(l)) {
					m[l] = k[l]
				}
			}
			return m
		}
	})();
	WORLD_SIZE_MC_HALF = 20037726.372307256;
	WORLD_SIZE_MC = WORLD_SIZE_MC_HALF * 2;
	var h = BMapGLLib.LuShu = function(m, l, k) {
		if (!l || l.length < 1) {
			return
		}
		this._map = m;
		if (k["geodesic"]) {
			this.path = g(l)
		} else {
			this.path = l
		}
		this.i = 0;
		this._setTimeoutQuene = [];
		this._opts = {
			icon: null,
			speed: 400,
			defaultContent: ""
		};
		if (!k["landmarkPois"]) {
			k["landmarkPois"] = []
		}
		this._setOptions(k);
		this._rotation = 0;
		if (!(this._opts.icon instanceof BMapGL.Icon)) {
			this._opts.icon = defaultIcon
		}
	};
	h.prototype._setOptions = function(k) {
		if (!k) {
			return
		}
		for (var l in k) {
			if (k.hasOwnProperty(l)) {
				this._opts[l] = k[l]
			}
		}
	};
	h.prototype.start = function() {
		var l = this,
			k = l.path.length;
		if (l.i && l.i < k - 1) {
			if (!l._fromPause) {
				return
			} else {
				if (!l._fromStop) {
					l._moveNext(++l.i)
				}
			}
		} else {
			l._addMarker();
			l._timeoutFlag = setTimeout(function() {
				l._addInfoWin();
				if (l._opts.defaultContent == "") {
					l.hideInfoWindow()
				}
				l._moveNext(l.i)
			}, 400)
		}
		this._fromPause = false;
		this._fromStop = false
	};
	h.prototype.stop = function() {
		this.i = 0;
		this._fromStop = true;
		clearInterval(this._intervalFlag);
		this._clearTimeout();
		for (var m = 0, l = this._opts.landmarkPois, k = l.length; m < k; m++) {
			l[m].bShow = false
		}
	};
	h.prototype.pause = function() {
		clearInterval(this._intervalFlag);
		this._fromPause = true;
		this._clearTimeout()
	};
	h.prototype.hideInfoWindow = function() {
		this._overlay._div.style.visibility = "hidden"
	};
	h.prototype.showInfoWindow = function() {
		this._overlay._div.style.visibility = "visible"
	};
	b.object.extend(h.prototype, {
		_addMarker: function(n) {
			if (this._marker) {
				this.stop();
				this._map.removeOverlay(this._marker);
				this._map.removeOverlay(this._markerL);
				this._map.removeOverlay(this._markerR);
				clearTimeout(this._timeoutFlag)
			}
			this._overlay && this._map.removeOverlay(this._overlay);
			var k = new BMapGL.Marker(this.path[0]);
			this._opts.icon && k.setIcon(this._opts.icon);
			this._map.addOverlay(k);
			k.setAnimation(BMAP_ANIMATION_DROP);
			this._marker = k;
			var l = new BMapGL.Marker(this.path[0], {
				left: true
			});
			this._opts.icon && l.setIcon(this._opts.icon);
			this._map.addOverlay(l);
			l.setAnimation(BMAP_ANIMATION_DROP);
			this._markerL = l;
			var m = new BMapGL.Marker(this.path[0], {
				right: true
			});
			this._opts.icon && m.setIcon(this._opts.icon);
			this._map.addOverlay(m);
			m.setAnimation(BMAP_ANIMATION_DROP);
			this._markerR = m
		},
		_addInfoWin: function() {
			var l = this;
			var k = new d(l._marker.getPosition(), l._opts.defaultContent);
			k.setRelatedClass(this);
			this._overlay = k;
			this._map.addOverlay(k)
		},
		_getMercator: function(k) {
			return this._map.getMapType().getProjection().lngLatToPoint(k)
		},
		_getDistance: function(l, k) {
			return Math.sqrt(Math.pow(l.x - k.x, 2) + Math.pow(l.y - k.y, 2))
		},
		_move: function(v, q, u) {
			var o = this,
				n = 0,
				k = 10,
				l = this._opts.speed / (1000 / k),
				t = BMapGL.Projection.convertLL2MC(v),
				s = BMapGL.Projection.convertLL2MC(q);
			t = new BMapGL.Pixel(t.lng, t.lat);
			s = new BMapGL.Pixel(s.lng, s.lat);
			var r = o._getDistance(t, s);
			var p = null;
			if (r > 30037726) {
				if (s.x < t.x) {
					s.x += WORLD_SIZE_MC;
					p = "right"
				} else {
					s.x -= WORLD_SIZE_MC;
					p = "left"
				}
			}
			var m = Math.round(o._getDistance(t, s) / l);
			if (m < 1) {
				o._moveNext(++o.i);
				return
			}
			o._intervalFlag = setInterval(function() {
				if (n >= m) {
					clearInterval(o._intervalFlag);
					if (o.i > o.path.length) {
						return
					}
					o._moveNext(++o.i)
				} else {
					n++;
					var w = u(t.x, s.x, n, m),
						B = u(t.y, s.y, n, m),
						A = BMapGL.Projection.convertMC2LL(new BMapGL.Point(w, B));
					if (A.lng > 180) {
						A.lng = A.lng - 360
					}
					if (A.lng < -180) {
						A.lng = A.lng + 360
					}
					if (n == 1) {
						var z = null;
						if (o.i - 1 >= 0) {
							z = o.path[o.i - 1]
						}
						if (o._opts.enableRotation == true) {
							o.setRotation(z, v, q, p)
						}
						if (o._opts.autoView) {
							if (!o._map.getBounds().containsPoint(A)) {
								o._map.setCenter(A)
							}
						}
					}
					o._marker.setPosition(A);
					o._markerL.setPosition(A);
					o._markerR.setPosition(A);
					o._setInfoWin(A)
				}
			}, k)
		},
		setRotation: function(s, l, t, r) {
			var p = this;
			var k = 0;
			l = p._map.pointToPixel(l);
			t = p._map.pointToPixel(t);
			if (t.x != l.x) {
				var q = (t.y - l.y) / (t.x - l.x),
					m = Math.atan(q);
				k = m * 360 / (2 * Math.PI);
				if ((!r && t.x < l.x) || (r === "left")) {
					k = -k + 90 + 90
				} else {
					k = -k
				}
				p._marker.setRotation(-k);
				p._markerL.setRotation(-k);
				p._markerR.setRotation(-k)
			} else {
				var n = t.y - l.y;
				var o = 0;
				if (n > 0) {
					o = -1
				} else {
					o = 1
				}
				p._marker.setRotation(-o * 90);
				p._markerL.setRotation(-o * 90);
				p._markerR.setRotation(-o * 90)
			}
			return
		},
		linePixellength: function(l, k) {
			return Math.sqrt(Math.abs(l.x - k.x) * Math.abs(l.x - k.x) + Math.abs(l.y - k.y) * Math.abs(l.y - k.y))
		},
		pointToPoint: function(l, k) {
			return Math.abs(l.x - k.x) * Math.abs(l.x - k.x) + Math.abs(l.y - k.y) * Math.abs(l.y - k.y)
		},
		_moveNext: function(k) {
			var l = this;
			if (k < this.path.length - 1) {
				l._move(l.path[k], l.path[k + 1], l._tween.linear)
			}
		},
		_setInfoWin: function(m) {
			var l = this;
			if (!l._overlay) {
				return
			}
			l._overlay.setPosition(m, l._marker.getIcon().size);
			var k = l._troughPointIndex(m);
			if (k != -1) {
				clearInterval(l._intervalFlag);
				l._overlay.setHtml(l._opts.landmarkPois[k].html);
				l._overlay.setPosition(m, l._marker.getIcon().size);
				l._pauseForView(k)
			} else {
				l._overlay.setHtml(l._opts.defaultContent)
			}
		},
		_pauseForView: function(k) {
			var m = this;
			var l = setTimeout(function() {
				m._moveNext(++m.i)
			}, m._opts.landmarkPois[k].pauseTime * 1000);
			m._setTimeoutQuene.push(l)
		},
		_clearTimeout: function() {
			for (var k in this._setTimeoutQuene) {
				clearTimeout(this._setTimeoutQuene[k])
			}
			this._setTimeoutQuene.length = 0
		},
		_tween: {
			linear: function(l, p, n, o) {
				var k = l;
				var r = p - l;
				var m = n;
				var q = o;
				return r * m / q + k
			}
		},
		_troughPointIndex: function(l) {
			var n = this._opts.landmarkPois;
			var o;
			for (var m = 0, k = n.length; m < k; m++) {
				if (!n[m].bShow) {
					o = this._map.getDistance(new BMapGL.Point(n[m].lng, n[m].lat), l);
					if (o < 10) {
						n[m].bShow = true;
						return m
					}
				}
			}
			return -1
		}
	});

	function g(m) {
		var n = [];
		for (var l = 0; l < m.length - 1; l++) {
			var k = j(m[l], m[l + 1]);
			n = n.concat(k)
		}
		n = n.concat(m[m.length - 1]);
		return n
	}

	function j(q, p) {
		if (q.equals(p)) {
			return [q]
		}
		var r = BMapGL.Projection.getDistance(f(q.lng), f(q.lat), f(p.lng), f(p.lat));
		var r = BMapGL.Projection.getDistanceByLL(q, p);
		if (r < 250000) {
			return [q]
		}
		var k = [];
		var o = Math.round(r / 150000);
		var m = i(q, p);
		k.push(q);
		for (var n = 0; n < o; n++) {
			var l = c(q, p, n / o, m);
			k.push(l)
		}
		k.push(p);
		return k
	}

	function c(u, t, v, C) {
		var o = u.lat;
		var n = t.lat;
		var B = u.lng;
		var w = t.lng;
		var D = f(o);
		var A = f(n);
		var l = f(B);
		var k = f(w);
		var F = Math.sin((1 - v) * C) / Math.sin(C);
		var E = Math.sin(v * C) / Math.sin(C);
		var r = F * Math.cos(D) * Math.cos(l) + E * Math.cos(A) * Math.cos(k);
		var q = F * Math.cos(D) * Math.sin(l) + E * Math.cos(A) * Math.sin(k);
		var p = F * Math.sin(D) + E * Math.sin(A);
		var m = Math.atan2(p, Math.sqrt(Math.pow(r, 2) + Math.pow(q, 2)));
		var s = Math.atan2(q, r);
		return new BMapGL.Point(a(s), a(m))
	}

	function f(k) {
		return k * Math.PI / 180
	}

	function a(k) {
		return k / Math.PI * 180
	}

	function i(o, l) {
		var p = f(o.lat);
		var n = f(l.lat);
		var m = f(o.lng);
		var k = f(l.lng);
		return Math.acos(Math.sin(p) * Math.sin(n) + Math.cos(p) * Math.cos(n) * Math.cos(Math.abs(k - m)))
	}

	function d(k, l) {
		this._point = k;
		this._html = l
	}
	d.prototype = new BMapGL.Overlay();
	d.prototype.initialize = function(k) {
		var l = this._div = b.dom.create("div", {
			style: "border:solid 1px #ccc;width:auto;min-width:50px;text-align:center;position:absolute;background:#fff;color:#000;font-size:12px;border-radius: 10px;padding:5px;white-space: nowrap;"
		});
		l.innerHTML = this._html;
		k.getPanes().floatPane.appendChild(l);
		this._map = k;
		return l
	};
	d.prototype.draw = function() {
		this.setPosition(this.lushuMain._marker.getPosition(), this.lushuMain._marker.getIcon().size)
	};
	b.object.extend(d.prototype, {
		setPosition: function(p, q) {
			var n = this._map.pointToOverlayPixel(p);
			var l = b.dom.getStyle(this._div, "width");
			var o = b.dom.getStyle(this._div, "height");
			var k = parseInt(this._div.clientWidth || l, 10);
			var m = parseInt(this._div.clientHeight || o, 10);
			this._div.style.left = n.x - k / 2 + "px";
			this._div.style.bottom = -(n.y - q.height) + "px"
		},
		setHtml: function(k) {
			this._div.innerHTML = k
		},
		setRelatedClass: function(k) {
			this.lushuMain = k
		}
	})
})();