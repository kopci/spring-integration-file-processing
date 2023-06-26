
COMPONENT('datagrid', 'checkbox:true;colwidth:150;schema:default;rowheight:30;minheight:200;clusterize:true;limit:80;rememberfilter:1;filterlabel:Filter;height:auto;margin:0;resize:true;reorder:true;sorting:true;boolean:true,on,yes;pluralizepages:# pages,# page,# pages,# pages;pluralizeitems:# items,# item,# items,# items;remember:true;highlight:false;unhighlight:true;autoselect:false;buttonapply:Apply;buttonreset:Reset;allowtitles:false;fullwidth_xs:false;clickid:id;dirplaceholder:Search;autoformat:1;controls:1;hfuncicon:square-root-alt;pagination:true;ovalue:id;otext:name', function(self, config) {

	var opt = { filter: {}, filtercache: {}, filtercl: {}, filtervalues: {}, scroll: false, selected: {}, operation: '' };
	var header, vbody, footer, container, ecolumns, isecolumns = false, ready = false;
	var sheader, sbody, econtrols;
	var Theadercol = Tangular.compile('<div class="dg-hcol dg-col-{{ index }}{{ if sorting }} dg-sorting{{ fi }}" data-index="{{ index }}">{{ if sorting }}<i class="dg-sort ti"></i>{{ fi }}<div class="dg-label{{ alignheader }}"{{ if labeltitle }} title="{{ labeltitle }}"{{ fi }}{{ if reorder }} draggable="true"{{ fi }}>{{ label | raw }}</div>{{ if filter }}<div class="dg-filter{{ alignfilter }}{{ if filterval != null && filterval !== \'\' }} dg-filter-selected{{ fi }}"><i class="ti dg-filter-cancel ti-times"></i>{{ if options }}<label data-name="{{ name }}">{{ if filterval }}{{ filterval }}{{ else }}{{ filter }}{{ fi }}</label>{{ else }}<input autocomplete="new-password" type="text" placeholder="{{ filter }}" class="dg-filter-input" name="{{ name }}{{ ts }}" data-name="{{ name }}" value="{{ filterval }}" />{{ fi }}</div>{{ else }}<div class="dg-filter-empty">&nbsp;</div>{{ fi }}</div>');
	var isIE = (/msie|trident/i).test(navigator.userAgent);
	var isredraw = false;
	var forcescroll = '';
	var schemas = {};
	var controls = { el: null, timeout: null, is: false, cache: {} };

	self.meta = opt;

	function Cluster(el, config) {

		var self = this;
		var dom = el[0];
		var scrollel = el;

		self.row = config.rowheight;
		self.rows = [];
		self.limit = config.limit;
		self.pos = -1;
		self.enabled = !!config.clusterize;
		self.plus = 0;
		self.scrolltop = 0;
		self.prev = 0;

		var seh = '<div style="height:0"></div>';
		var set = $(seh);
		var seb = $(seh);

		var div = document.createElement('DIV');
		dom.appendChild(set[0]);
		dom.appendChild(div);
		dom.appendChild(seb[0]);
		self.el = $(div);

		self.render = function() {

			var t = self.pos * self.frame;
			var b = (self.rows.length * self.row) - (self.frame * 2) - t;
			var pos = self.pos * self.limit;
			var posto = pos + (self.limit * 2);

			set.css('height', t);
			seb.css('height', b < 2 ? isMOBILE ? (config.exec && config.pagination ? (self.row + 1) : (self.row * 2.25)) >> 0 : 3 : b);

			var tmp = self.scrollbar[0].scrollTop;
			var node = self.el[0];
			// node.innerHTML = '';

			var child = node.firstChild;

			while (child) {
				node.removeChild(child);
				child = node.firstChild;
			}

			for (var i = pos; i < posto; i++) {
				if (typeof(self.rows[i]) === 'string')
					self.rows[i] = $(self.rows[i])[0];
				if (self.rows[i])
					node.appendChild(self.rows[i]);
				else
					break;
			}

			if (self.prev < t)
				self.scrollbar[0].scrollTop = t;
			else
				self.scrollbar[0].scrollTop = tmp;

			self.prev = t;

			if (self.grid.selected) {
				var index = opt.rows.indexOf(self.grid.selected);
				if (index !== -1 && (index >= pos || index <= (pos + self.limit)))
					self.el.find('.dg-row[data-index="{0}"]'.format(index)).aclass('dg-selected');
			}
		};

		self.scrolling = function() {

			var y = self.scrollbar[0].scrollTop + 1;
			self.scrolltop = y;

			if (y < 0)
				return;

			var frame = Math.ceil(y / self.frame) - 1;
			if (frame === -1)
				return;

			if (self.pos !== frame) {

				// The content could be modified
				var plus = (self.el[0].offsetHeight / 2) - self.frame;
				if (plus > 0) {
					frame = Math.ceil(y / (self.frame + plus)) - 1;
					if (self.pos === frame)
						return;
				}

				if (self.max && frame >= self.max)
					frame = self.max;

				self.pos = frame;

				if (self.enabled)
					self.render();
				else {

					var node = self.el[0];
					var child = node.firstChild;

					while (child) {
						node.removeChild(child);
						child = node.firstChild;
					}

					for (var i = 0; i < self.rows.length; i++) {
						if (typeof(self.rows[i]) === 'string')
							self.rows[i] = $(self.rows[i])[0];
						self.el[0].appendChild(self.rows[i]);
					}
				}

				self.scroll && self.scroll();
				config.change && self.grid.SEEX(config.change, null, null, self.grid);
			}

			if (self.grid.config.exec && !self.grid.config.pagination && !self.grid.isloading) {
				var tmp = self.height + y;
				var h = self.scrollbar[0].scrollHeight;
				if (!self.grid.hclass('noscroll') && tmp >= h && h !== self.scrollheight) {
					self.scrollheight = h;
					self.grid.isloading = true;
					self.grid.operation('page');
				}
			}
		};

		self.update = function(rows, noscroll) {

			if (noscroll != true)
				self.el[0].scrollTop = 0;

			self.limit = self.grid.config.limit;
			self.pos = -1;
			self.rows = rows;
			self.max = Math.ceil(rows.length / self.limit) - 1;
			self.frame = self.limit * self.row;
			self.height = self.scrollbar.height();
			self.grid.isloading = false;

			if (!self.enabled) {
				self.frame = 1000000;
			} else if (config.height === 'fluid') {
				self.limit = 1000000;
			} else if (self.limit * 2 > rows.length) {
				self.limit = rows.length;
				self.frame = self.limit * self.row;
				self.max = 1;
			}

			self.scrolling();
		};

		self.destroy = function() {
			self.el.off('scroll');
			self.rows = null;
		};

		self.scrollbar = scrollel.closest('.ui-scrollbar-area');
		self.scrollbar.on('scroll', self.scrolling);
	}

	self.destroy = function() {
		opt.cluster && opt.cluster.destroy();
	};

	// opt.cols    --> columns
	// opt.rows    --> raw rendered data
	// opt.render  --> for cluster

	self.init = function() {

		ON('resize + resize2', function() {
			setTimeout2('datagridresize', ASETTER('datagrid/resize'), 500);
		});

		Thelpers.ui_datagrid_autoformat = function(val, type) {

			switch (type) {
				case 'email':
					return val && val.length > 2 ? '<a href="mailto:{0}" class="dg-link"><i class="ti ti-envelope"></i>{0}</a>'.format(val) : val;
				case 'phone':
					return val && val.length > 2 ? '<a href="tel:{0}" class="dg-link"><i class="ti ti-phone"></i>{0}</a>'.format(val) : val;
				case 'url':
					return val && val.length > 7 && (/http(s):\/\//i).test(val) ? '<a href="{0}" target="_blank" class="dg-link"><i class="ti ti-globe-world"></i>{0}</a>'.format(val) : val;
			}

			return val;
		};

		Thelpers.ui_datagrid_checkbox = function(val) {
			return '<div class="dg-checkbox' + (val ? ' dg-checked' : '') + '" data-custom="1"><i class="ti ti-check"></i></div>';
		};

		Thelpers.ui_datagrid_colorize = function(val, encode) {
			var hash = HASH(val + '');
			var color = '#';
			for (var i = 0; i < 3; i++) {
				var value = (hash >> (i * 8)) & 0xFF;
				color += ('00' + value.toString(16)).substr(-2);
			}
			var tmp = encode ? Thelpers.encode(val) : val;
			return tmp ? '<span style="background:{0}" class="dg-colorize">{1}</span>'.format(color, tmp) : '';
		};
	};

	self.readonly();
	// self.bindvisible();
	self.nocompile();

	var reconfig = function() {
		self.tclass('dg-clickable', !!(config.click || config.dblclick));
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'schema':
				!init && self.schema(value);
				break;
			case 'noborder':
				self.tclass('dg-noborder', !!value);
				break;
			case 'checkbox':
			case 'numbering':
				!init && self.cols(NOOP);
				break;
			case 'pluralizepages':
				config.pluralizepages = value.split(',').trim();
				break;
			case 'pluralizeitems':
				config.pluralizeitems = value.split(',').trim();
				break;
			case 'checked':
			case 'button':
			case 'exec':
				if (value && value.SCOPE)
					config[key] = value.SCOPE(self, value);
				break;
			case 'dblclick':
				if (value && value.SCOPE)
					config.dblclick = value.SCOPE(self, value);
				break;
			case 'click':
				if (value && value.SCOPE)
					config.click = value.SCOPE(self, value);
				break;
			case 'columns':
				self.datasource(value, function(path, value, type) {
					if (value) {
						opt.sort = null;
						opt.filter = {};
						opt.scroll = '';
						opt.selected = {};
						self.rebind(value, true);
						type && self.setter(null);
					}
				});
				break;
			case 'hfunc':
				if (value && typeof(value) === 'string')
					config.hfunc = self.makepath(value);
				break;
		}

		setTimeout2(self.ID + 'reconfigure', reconfig);
	};

	self.refresh = function() {
		self.refreshfilter();
	};

	self.applycolumns = function(use) {
		isecolumns = false;
		ecolumns.aclass('hidden');
		if (use) {
			var nothidden = {};
			ecolumns.find('.dg-columns-checkbox-checked').each(function() {
				nothidden[this.getAttribute('data-id')] = true;
			});
			self.cols(function(cols) {
				for (var i = 0; i < cols.length; i++) {
					var col = cols[i];
					col.hidden = nothidden[col.id] !== true;
				}
			});
		}
	};

	self.fn_in_changed = function(arr) {
		config.changed && self.SEEX(config.changed, arr || self.changed(), self);
	};

	self.fn_in_checked = function(arr) {
		config.checked && self.SEEX(config.checked, arr || self.checked(), self);
	};

	self.fn_refresh = function() {
		setTimeout2(self.ID + 'filter', function() {
			if (config.exec)
				self.operation(opt.operation);
			else
				self.refreshfilter(true);
		}, 50);
	};

	var makeopt = function() {
		return { filter: {}, filtervalues: {}, filtercl: {}, filtercache: {} };
	};

	self.make = function() {

		self.IDCSS = GUID(5);
		self.aclass('dg dg-noscroll dg-' + self.IDCSS + (config.height === 'fluid' ? ' dg-fluid' : ''));

		self.find('script').each(function() {

			var el = $(this);
			var id = el.attrd('id');
			var html = el.html();

			if (id)
				schemas[id] = { schema: html, opt: makeopt() };

			if (!schemas.default)
				schemas.default = { schema: html, opt: makeopt() };

		});

		controls.show = function(dom) {

			if (controls.ishidding || !opt.controls || !config.controls)
				return;

			var el = $(dom);
			var off = el.position();
			var css = {};
			var clshover = 'dg-row-hover';
			var index = el.attrd('index');
			controls.el && controls.el.rclass(clshover);
			controls.el = $(dom).aclass(clshover);

			var div = controls.cache[index];

			if (div === null) {
				controls.hide();
				return;
			}

			if (!div) {
				var html = opt.controls(opt.rows[+index]);
				div = controls.cache[index] = html ? $('<div>' + html + '</div>')[0] : null;
				controls.cache[index] = div;
				if (div === null) {
					controls.hide();
					return;
				}
			}

			while (true) {
				var child = econtrols[0].firstChild;
				if (child)
					econtrols[0].removeChild(child);
				else
					break;
			}

			econtrols[0].appendChild(div);
			css.top = Math.ceil(off.top - ((econtrols.height() / 2) - (config.rowheight / 2))) - 2;
			econtrols.css(css).rclass('hidden').aclass('dg-controls-visible', 50).attrd('index', index);
			controls.timeout = null;
			controls.is = true;
			controls.y = self.scrollbarY ? self.scrollbarY.scrollTop() : 0;
		};

		controls.hide = function(type) {
			if (controls.is) {

				// scrollbar
				if (type === 1) {
					var y = self.scrollbarY ? self.scrollbarY.scrollTop() : 0;
					if (controls.y === y)
						return;
				} else if (type === 2) {
					controls.ishidding = true;
					setTimeout(function() {
						controls.ishidding = false;
					}, 1000);
				}

				controls.el.rclass('dg-row-hover');
				controls.el = null;
				controls.is = false;
				econtrols.aclass('hidden').rclass('dg-controls-visible');
			}
		};

		ON('scroll', function() {
			controls.hide(1);
		});

		self.event('mouseenter', '.dg-row', function(e) {
			controls.timeout && clearTimeout(controls.timeout);
			controls.timeout = setTimeout(controls.show, controls.is ? 50 : 500, this, e);
		});

		var pagination = '';
		if (config.exec && config.pagination)
			pagination = '<div class="dg-footer hidden"><div class="dg-pagination-items hidden-xs"></div><div class="dg-pagination"><button name="page-first" disabled><i class="ti ti-angle-double-left"></i></button><button name="page-prev" disabled><i class="ti ti-angle-left"></i></button><div><input type="text" name="page" maxlength="5" class="dg-pagination-input" /></div><button name="page-next" disabled><i class="ti ti-angle-right"></i></button><button name="page-last" disabled><i class="ti ti-angle-double-right"></i></button></div><div class="dg-pagination-pages"></div></div>';

		self.dom.innerHTML = '<div class="dg-btn-columns"><span class="ti ti-columns"></span></div><div class="dg-columns hidden"><div><div class="dg-columns-body"></div></div><button class="dg-columns-button" name="columns-apply"><i class="ti ti-check-circle"></i>{1}</button><span class="dt-columns-reset">{2}</span></div><div class="dg-container"><div class="dg-controls"></div><span class="dg-resize-line hidden"></span><div class="dg-header-scrollbar"><div class="dg-header"></div><div class="dg-body-scrollbar"><div class="dg-body"></div></div></div></div>{0}'.format(pagination, config.buttonapply, config.buttonreset);

		header = self.find('.dg-header');
		vbody = self.find('.dg-body');
		footer = self.find('.dg-footer');
		container = self.find('.dg-container');
		ecolumns = self.find('.dg-columns');
		sheader = self.find('.dg-header-scrollbar');
		sbody = self.find('.dg-body-scrollbar');
		econtrols = self.find('.dg-controls');

		container.on('mouseleave', function() {
			controls.hide(2);
		});

		self.scrollbarY = config.height !== 'fluid' ? SCROLLBAR(sbody, { visibleY: true, orientation: 'y', controls: container, marginY: isMOBILE ? 0 : 60 }) : null;
		self.scrollbarX = SCROLLBAR(sheader, { visibleX: true, orientation: 'x', controls: container });

		var schemaname = config.schema;
		var schema = schemas[schemaname];

		if (schema) {
			self.rebind(schema.schema);
			schemas.$current = schemaname;
		}

		var events = {};

		events.mouseup = function(e) {
			if (r.is) {
				r.is = false;
				r.line.aclass('hidden');
				r.el.css('height', r.h);
				var x = r.el.css('left').parseInt();
				var index = +r.el.attrd('index');
				var width = opt.cols[index].width + (x - r.x);
				self.resizecolumn(index, width);
				e.preventDefault();
				e.stopPropagation();
			}
			events.unbind();
		};

		container.on('contextmenu', function(e) {
			if (config.contextmenu) {
				e.preventDefault();
				self.EXEC(config.contextmenu, e, self);
			}
		});

		events.unbind = function() {
			$(W).off('mouseup', events.mouseup).off('mousemove', events.mousemove);
		};

		events.bind = function() {
			$(W).on('mouseup', events.mouseup).on('mousemove', events.mousemove);
		};

		var hidedir = function() {
			ishidedir = true;
			SETTER('!directory', 'hide');
			setTimeout(function() {
				ishidedir = false;
			}, 800);
		};

		var ishidedir = false;
		var r = { is: false };

		self.event('click', '.dg-btn-columns', function(e) {

			e.preventDefault();
			e.stopPropagation();

			controls.hide();

			var cls = 'hidden';
			if (isecolumns) {
				self.applycolumns();
			} else {
				var builder = [];

				for (var i = 0; i < opt.cols.length; i++) {
					var col = opt.cols[i];
					(col.listcolumn && !col.$hidden) && builder.push('<div><label class="dg-columns-checkbox{1}" data-id="{0}"><span><i class="ti ti-check"></i></span>{2}</label></div>'.format(col.id, col.hidden ? '' : ' dg-columns-checkbox-checked', col.text));
				}

				ecolumns.find('.dg-columns-body')[0].innerHTML = builder.join('');
				ecolumns.rclass(cls);
				isecolumns = true;
			}
		});

		header.on('click', 'label', function() {

			var el = $(this);
			var index = +el.closest('.dg-hcol').attrd('index');
			var col = opt.cols[index];
			var opts = col.options instanceof Array ? col.options : GET(self.makepath(col.options));
			var dir = {};

			if (typeof opts === 'function')
				opts = opts();

			controls.hide();
			dir.element = el;
			dir.items = opts;
			dir.key = col.otext;
			dir.offsetX = -6;
			dir.offsetY = -2;
			dir.placeholder = config.dirplaceholder;

			dir.callback = function(item) {
				self.applyfilterdirectory(el, col, item);
			};

			SETTER('directory', 'show', dir);
		});

		self.event('dblclick', '.dg-col', function(e) {
			controls.hide();
			e.preventDefault();
			e.stopPropagation();
			self.editcolumn($(this));
		});

		var dblclick = { ticks: 0, id: null, row: null };
		r.line = container.find('.dg-resize-line');

		var findclass = function(node) {
			var count = 0;
			while (true) {
				for (var i = 1; i < arguments.length; i++) {
					if (node.classList.contains(arguments[i]))
						return true;
				}
				node = node.parentNode;
				if ((count++) > 4)
					break;
			}
		};

		self.event('click', '.dg-row', function(e) {

			var now = Date.now();
			var el = $(this);
			var type = e.target.tagName;
			var target = $(e.target);

			if ((type === 'DIV' || type === 'SPAN')) {

				var cls = 'dg-selected';
				var elrow = el.closest('.dg-row');
				var index = +elrow.attrd('index');
				var row = opt.rows[index];
				if (!row)
					return;

				if (config.dblclick && dblclick.ticks && dblclick.ticks > now && dblclick.row === row && !findclass(e.target, 'dg-checkbox', 'dg-editable')) {
					config.dblclick && self.SEEX(config.dblclick, row, self, elrow, target);
					if (config.highlight && self.selected !== row) {
						opt.cluster.el.find('.' + cls).rclass(cls);
						self.selected = row;
						elrow.aclass(cls);
					}
					e.preventDefault();
					return;
				}

				dblclick.row = row;
				dblclick.ticks = now + 300;

				var rowarg = row;

				if (config.highlight) {
					opt.cluster.el.find('.' + cls).rclass(cls);
					if (!config.unhighlight || self.selected !== row) {
						self.selected = row;
						elrow.aclass(cls);
						controls.show(el[0]);
					} else {
						rowarg = self.selected = null;
						controls.is && controls.hide();
					}
				} else {
					if (controls.is)
						controls.hide();
					else if (rowarg)
						controls.show(el[0]);
				}

				config.click && self.SEEX(config.click, rowarg, self, elrow, target);
			}
		});

		self.reload = function() {
			self.operation('refresh');
		};

		self.empty = function() {
			self.set({ page: 1, pages: 0, count: 0, items: [], limit: 0 });
		};

		self.released = function(is) {
			!is && setTimeout(self.resize, 500);
		};

		self.event('click', '.dg-filter-cancel,.dt-columns-reset', function() {
			var el = $(this);

			controls.hide();

			if (el.hclass('dt-columns-reset'))
				self.resetcolumns();
			else {
				var tmp = el.parent();
				var input = tmp.find('input');
				if (input.length) {
					input.val('');
					input.trigger('change');
					return;
				}

				var label = tmp.find('label');
				if (label.length) {
					tmp.rclass('dg-filter-selected');
					var index = +el.closest('.dg-hcol').attrd('index');
					var col = opt.cols[index];
					var k = label.attrd('name');
					label.html(col.filter);
					forcescroll = opt.scroll = 'y';
					opt.operation = 'filter';
					delete opt.filter[k];
					delete opt.filtervalues[col.id];
					delete opt.filtercl[k];
					self.fn_refresh();
				}
			}
		});

		self.event('click', '.dg-label,.dg-sort', function() {

			var el = $(this).closest('.dg-hcol');

			controls.hide();

			if (!el.find('.dg-sort').length)
				return;

			var index = +el.attrd('index');

			for (var i = 0; i < opt.cols.length; i++) {
				if (i !== index)
					opt.cols[i].sort = 0;
			}

			var col = opt.cols[index];
			switch (col.sort) {
				case 0:
					col.sort = 1;
					break;
				case 1:
					col.sort = 2;
					break;
				case 2:
					col.sort = 0;
					break;
			}

			opt.sort = col;
			opt.operation = 'sort';
			forcescroll = '-';

			if (config.exec)
				self.operation(opt.operation);
			else
				self.refreshfilter(true);
		});

		isIE && self.event('keydown', 'input', function(e) {
			if (e.keyCode === 13)
				$(this).blur();
			else if (e.keyCode === 27)
				$(this).val('');
		});

		self.event('mousedown', function(e) {

			var el = $(e.target);

			if (!el.hclass('dg-resize'))
				return;

			controls.hide();
			events.bind();

			var offset = self.element.offset().left;
			r.el = el;
			r.offset = offset; //offset;

			var prev = el.prev();
			r.min = (prev.length ? prev.css('left').parseInt() : (config.checkbox ? 70 : 30)) + 50;
			r.h = el.css('height');
			r.x = el.css('left').parseInt();
			r.line.css('height', opt.height);
			r.is = true;
			r.isline = false;
			e.preventDefault();
			e.stopPropagation();
		});

		header.on('mousemove', function(e) {
			if (r.is) {
				var x = (e.pageX - r.offset - 10);
				var x2 = self.scrollbarX.scrollLeft() + x;
				if (x2 < r.min)
					x2 = r.min;

				r.el.css('left', x2);
				r.line.css('left', x + 9);

				if (!r.isline) {
					r.isline = true;
					r.line.rclass('hidden');
				}

				e.preventDefault();
				e.stopPropagation();
			}
		});

		self.applyfilterdirectory = function(label, col, item) {

			var val = item[col.ovalue];
			var is = val != null && val !== '';
			var name = label.attrd('name');

			opt.filtervalues[col.id] = val;

			if (is) {
				if (opt.filter[name] == val)
					return;
				opt.filter[name] = val;
			} else
				delete opt.filter[name];

			delete opt.filtercache[name];
			opt.filtercl[name] = val;

			forcescroll = opt.scroll = 'y';
			opt.operation = 'filter';
			label.parent().tclass('dg-filter-selected', is);
			label.text(is ? (item[col.otext] || '') : col.filter);
			self.fn_refresh();
		};

		var d = { is: false };

		self.event('dragstart', function(e) {
			!isIE && e.originalEvent.dataTransfer.setData('text/plain', GUID());
		});

		self.event('dragenter dragover dragexit drop dragleave', function (e) {

			e.stopPropagation();
			e.preventDefault();

			switch (e.type) {
				case 'drop':

					if (d.is) {
						var col = opt.cols[+$(e.target).closest('.dg-hcol').attrd('index')];
						col && self.reordercolumn(d.index, col.index);
					}

					d.is = false;
					break;

				case 'dragenter':
					if (!d.is) {
						d.index = +$(e.target).closest('.dg-hcol').attrd('index');
						d.is = true;
					}
					return;
				case 'dragover':
					return;
				default:
					return;
			}
		});

		self.event('change', '.dg-pagination-input', function() {

			var value = self.get();
			var val = +this.value;

			if (isNaN(val))
				return;

			if (val >= value.pages)
				val = value.pages;
			else if (val < 1)
				val = 1;

			value.page = val;
			forcescroll = opt.scroll = 'y';
			self.operation('page');
			controls.hide();
		});

		self.event('change', '.dg-filter-input', function() {

			var input = this;
			var $el = $(this);
			var el = $el.parent();
			var val = $el.val();
			var name = input.getAttribute('data-name');

			var col = opt.cols[+el.closest('.dg-hcol').attrd('index')];
			delete opt.filtercache[name];
			delete opt.filtercl[name];

			if (col.options) {
				if (val)
					val = (col.options instanceof Array ? col.options : GET(self.makepath(col.options)))[+val][col.ovalue];
				else
					val = null;
			}

			var is = val != null && val !== '';

			if (col)
				opt.filtervalues[col.id] = val;

			if (is) {
				if (opt.filter[name] == val)
					return;
				opt.filter[name] = val;
			} else
				delete opt.filter[name];

			forcescroll = opt.scroll = 'y';
			opt.operation = 'filter';
			el.tclass('dg-filter-selected', is);
			self.fn_refresh();
			controls.hide();
		});

		self.select = function(row) {

			var index;

			if (typeof(row) === 'number') {
				index = row;
				row = opt.rows[index];
			} else if (row)
				index = opt.rows.indexOf(row);

			var cls = 'dg-selected';
			if (!row || index === -1) {
				self.selected = null;
				opt.cluster && opt.cluster.el.find('.' + cls).rclass(cls);
				config.highlight && config.click && self.SEEX(config.click, null, self);
				return;
			}

			self.selected = row;

			var elrow = opt.cluster.el.find('.dg-row[data-index="{0}"]'.format(index));
			if (elrow && config.highlight) {
				opt.cluster.el.find('.' + cls).rclass(cls);
				elrow.aclass(cls);
			}

			config.click && self.SEEX(config.click, row, self, elrow, null);
			controls.hide();
		};

		self.event('click', '.dg-hfunc', function(e) {
			var t = $(this);
			e.preventDefault();
			e.stopPropagation();
			self.SEEX(config.hfunc, t);
		});

		self.event('click', '.dg-checkbox', function(e) {

			var t = $(this);
			var custom = t.attrd('custom');

			if (custom === '1')
				return;

			e.preventDefault();
			e.stopPropagation();

			t.tclass('dg-checked');

			if (custom === '2')
				return;

			var val = t.attrd('value');
			var checked = t.hclass('dg-checked');

			if (val === '-1') {
				if (checked) {
					opt.checked = {};
					for (var i = 0; i < opt.rows.length; i++)
						opt.checked[opt.rows[i].ROW] = 1;
				} else
					opt.checked = {};
				self.scrolling();
			} else if (checked)
				opt.checked[val] = 1;
			else
				delete opt.checked[val];

			self.fn_in_checked();
		});

		self.event('click', '.dg-columns-checkbox', function() {
			$(this).tclass('dg-columns-checkbox-checked');
		});

		self.event('click', 'button', function(e) {
			switch (this.name) {
				case 'columns-apply':
					self.applycolumns(true);
					break;
				case 'page-first':
					forcescroll = opt.scroll = 'y';
					self.get().page = 1;
					self.operation('page');
					break;
				case 'page-last':
					forcescroll = opt.scroll = 'y';
					var tmp = self.get();
					tmp.page = tmp.pages;
					self.operation('page');
					break;
				case 'page-prev':
					forcescroll = opt.scroll = 'y';
					self.get().page -= 1;
					self.operation('page');
					break;
				case 'page-next':
					forcescroll = opt.scroll = 'y';
					self.get().page += 1;
					self.operation('page');
					break;
				default:
					var el = $(this);
					var index = +el.closest('.dg-row,.dg-controls').attrd('index');
					var row = opt.rows[index];
					config.button && self.SEEX(config.button, this.name, row, el, e);
					break;
			}
		});

		self.scrollbarX.area.on('scroll', function() {
			!ishidedir && hidedir();
			isecolumns && self.applycolumns();
		});


		self.resize();
		// config.exec && self.operation('init');
	};

	self.operation = function(type) {

		var value = self.get();

		if (value == null)
			value = {};

		if (type === 'filter' || type === 'init')
			value.page = 1;

		var keys = Object.keys(opt.filter);
		self.SEEX(config.exec, type, keys.length ? opt.filter : null, opt.sort && opt.sort.sort ? [(opt.sort.name + '_' + (opt.sort.sort === 1 ? 'asc' : 'desc'))] : null, value.page, self);

		switch (type) {
			case 'sort':
				self.redrawsorting();
				break;
		}
	};

	function align(type) {
		return type === 1 ? 'center' : type === 2 ? 'right' : type;
	}

	self.clear = function() {
		for (var i = 0; i < opt.rows.length; i++)
			opt.rows[i].CHANGES = undefined;
		self.renderrows(opt.rows, true);
		opt.cluster && opt.cluster.update(opt.render);
		self.fn_in_changed();
	};

	self.editcolumn = function(rindex, cindex) {

		var col;
		var row;

		if (cindex == null) {
			if (rindex instanceof jQuery) {
				cindex = rindex.attr('class').match(/\d+/);
				if (cindex)
					cindex = +cindex[0];
				else
					return;
				col = rindex;
			}
		} else
			row = opt.cluster.el.find('.dg-row-' + (rindex + 1));

		if (!col)
			col = row.find('.dg-col-' + cindex);

		var index = cindex;
		if (index == null)
			return;

		if (!row)
			row = col.closest('.dg-row');

		var data = {};
		data.col = opt.cols[index];
		if (!data.col.editable)
			return;

		data.rowindex = +row.attrd('index');
		data.row = opt.rows[data.rowindex];
		data.colindex = index;
		data.value = data.row[data.col.name];
		data.elrow = row;
		data.elcol = col;

		var clone = col.clone();
		var cb = function(data) {

			if (data == null) {
				col.replaceWith(clone);
				return;
			}

			data.row[data.col.name] = data.value;

			if (opt.rows[data.rowindex] != data.row)
				opt.rows[data.rowindex] = data.row;

			if (!data.row.CHANGES)
				data.row.CHANGES = {};

			data.row.CHANGES[data.col.name] = true;
			opt.render[data.rowindex] = $(self.renderrow(data.rowindex, data.row))[0];
			data.elrow.replaceWith(opt.render[data.rowindex]);
			self.fn_in_changed();

		};

		if (config.change)
			self.EXEC(config.change, data, cb, self);
		else
			self.datagrid_edit(data, cb);
	};

	self.applyfilter = function(obj, add) {

		if (!ready) {
			setTimeout(self.applyfilter, 100, obj, add);
			return;
		}

		if (!add)
			opt.filter = {};

		for (var key in obj) {
			var col = opt.cols.findItem('name', key);
			if (col.options) {
				var items = col.options instanceof Array ? col.options : GET(self.makepath(col.options));
				if (items instanceof Array) {
					var item = items.findItem(col.ovalue, obj[key]);
					if (item) {
						var el = header.find('.dg-hcol[data-index="{0}"] label'.format(col.index));
						if (el.length)
							self.applyfilterdirectory(el, col, item);
					}
				}
			}
		}

		header.find('input').each(function() {
			var t = this;
			var el = $(t);
			var val = obj[el.attrd('name')];
			if (val !== undefined)
				el.val(val == null ? '' : val);
		}).trigger('change');

	};

	self.schema = function(name) {

		var tmp = schemas.$current ? schemas[schemas.$current] : null;
		if (tmp && config.rememberfilter) {
			for (var key in opt.filter)
				tmp.opt.filter[key] = opt.filter[key];

			for (var key in opt.filtercache)
				tmp.opt.filtercache[key] = opt.filtercache[key];

			for (var key in opt.filtercl)
				tmp.opt.filtercl[key] = opt.filtercl[key];

			for (var key in opt.filtervalues)
				tmp.opt.filtervalues[key] = opt.filtervalues[key];
		}

		schemas.$current = name;
		self.selected = null;

		tmp = schemas[name];
		if (!tmp) {
			tmp = schemas.default;
			schemas.$current = 'default';
		}

		opt.filter = {};
		if (config.rememberfilter) {
			for (var key in tmp.opt.filter)
				opt.filter[key] = tmp.opt.filter[key];
		}

		opt.filtercache = {};
		if (config.rememberfilter) {
			for (var key in tmp.opt.filtercache)
				opt.filtercache[key] = tmp.opt.filtercache[key];
		}

		opt.filtercl = {};
		if (config.rememberfilter) {
			for (var key in tmp.opt.filtercl)
				opt.filtercl[key] = tmp.opt.filtercl[key];
		}

		opt.filtervalues = {};

		if (config.rememberfilter) {
			for (var key in tmp.opt.filtervalues)
				opt.filtervalues[key] = tmp.opt.filtervalues[key];
			for (var col of opt.cols)
				col.filtervalue = null;
		} else {
			for (var col of opt.cols)
				col.filtervalue = null;
		}

		self.rebind(tmp.schema, true);

		if (config.exec) {
			self.set(null);
		} else {
			setTimeout(function() {
				self.refresh();
			}, 100);
		}
	};

	self.rebind = function(code, prerender) {

		if (code.length < 30 && code.indexOf(' ') === -1) {
			schemas.$current = code;
			self.selected = null;
			var tmp = schemas[code];
			if (!tmp) {
				tmp = schemas.default;
				schemas.$current = 'default';
			}
			self.rebind(tmp.schema, prerender);
			return;
		}

		opt.declaration = code;

		var type = typeof(code);
		if (type === 'string') {
			code = code.trim();
			self.gridid = 'dg' + HASH(code);
		} else
			self.gridid = 'dg' + HASH(JSON.stringify(code));

		var cache = config.remember ? W.PREF ? W.PREF.get(self.gridid) : CACHE(self.gridid) : null;
		var cols = type === 'string' ? new Function('return ' + code)() : CLONE(code);
		var tmp;

		opt.rowclasstemplate = null;
		opt.search = false;
		opt.colsfilter = {};

		for (var i = 0; i < cols.length; i++) {
			var col = cols[i];

			if (typeof(col) === 'string') {
				opt.rowclasstemplate = Tangular.compile(col);
				cols.splice(i, 1);
				i--;
				continue;
			}

			if (col.type === 'controls' || col.type === 'buttons') {
				opt.controls = col.template ? Tangular.compile(col.template) : null;
				cols.splice(i, 1);
				i--;
				continue;
			}

			col.id = col.id || HASH(i.padLeft(2) + (col.name || '') + (col.text || '') + (col.width || '') + (col.template || '')).toString(36);
			col.realindex = i;

			if (!col.name)
				col.name = col.id;

			if (col.listcolumn == null)
				col.listcolumn = true;

			if (col.hidden) {
				col.$hidden = FN(col.hidden)(col) === true;
				col.hidden = col.$hidden;
			}

			if (col.hide) {
				col.hidden = col.hide === true;
				delete col.hide;
			}

			if (col.options) {
				!col.otext && (col.otext = config.otext);
				!col.ovalue && (col.ovalue = config.ovalue);
			}

			// SORT?
			if (col.sort != null)
				col.sorting = col.sort;

			if (cache) {
				var c = cache[i];
				if (c) {
					col.index = c.index;
					col.width = c.width;
					col.hidden = c.hidden;
				}
			}

			if (col.index == null)
				col.index = i;

			if (col.sorting == null)
				col.sorting = config.sorting;

			if (col.alignfilter != null)
				col.alignfilter = ' ' + align(col.alignfilter);

			if (col.alignheader != null)
				col.alignheader = ' ' + align(col.alignheader);

			col.sort = 0;

			if (col.search) {
				opt.search = true;
				col.search = col.search === true ? Tangular.compile(col.template) : Tangular.compile(col.search);
			}

			if (!col.align) {
				switch (col.type) {
					case 'date':
						col.align = 1;
						break;
					case 'number':
						col.align = 2;
						break;
					case 'boolean':
						col.align = 1;
						break;
				}
			}

			if (col.align && col.align !== 'left') {
				col.align = align(col.align);
				col.align = ' ' + col.align;
				if (!col.alignfilter)
					col.alignfilter = ' center';
				if (!col.alignheader)
					col.alignheader = ' center';
			}

			var cls = col.class ? (' ' + col.class) : '';

			if (col.editable) {
				cls += ' dg-editable';
				if (col.required)
					cls += ' dg-required';
			}

			if (config.autoformat) {
				switch (col.type) {
					case 'number':
						if (col.monospace == null)
							col.monospace = true;
						break;
				}
			}

			var isbool = col.type && col.type.substring(0, 4) === 'bool';
			var TC = Tangular.compile;

			if (col.template) {
				col.templatecustom = true;
				col.template = TC((col.template.indexOf('<button') === -1 ? ('<div class="dg-value' + (col.monospace ? ' dg-monospace' : '') + cls + '">{0}</div>') : '{0}').format(col.template));
			} else
				col.template = TC(('<div class="' + (isbool ? 'dg-bool' : ('dg-value' + (col.monospace ? ' dg-monospace' : ''))) + cls + '"' + (config.allowtitles ? ' title="{{ {0} }}"' : '') + '>{{ {0} }}</div>').format(col.name + (col.currency ? ' | currency(\'{0}\')'.format(col.currency) : col.format != null ? ' | format({0})'.format(col.format && typeof(col.format) === 'string' ? ('\'' + col.format + '\'') : col.format) : '') + (col.type && config.autoformat ? ' | ui_datagrid_autoformat(\'{0}\')'.format(col.type) : '') + (col.empty ? ' | def({0})'.format(col.empty === true || col.empty == '1' ? '' : ('\'' + col.empty + '\'')) : '') + (isbool ? ' | ui_datagrid_checkbox' : '') + (col.colorize ? (' | ui_datagrid_colorize(' + (col.currency || col.format ? 0 : 1) + ')') : '')));

			if (col.header)
				col.header = TC(col.header);
			else
				col.header = TC('{{ text | raw }}');

			if (!col.text)
				col.text = col.name;

			if (col.text.substring(0, 1) === '.')
				col.text = '<i class="{0}"></i>'.format(col.text.substring(1));

			if (col.filter !== false && !col.filter)
				col.filter = config.filterlabel;

			if (!col.filtervalue && opt.filtervalues != null)
				col.filtervalue = opt.filtervalues[col.id];

			if (col.filtervalue != null) {
				tmp = col.filtervalue;
				if (typeof(tmp) === 'function')
					tmp = tmp(col);
				opt.filter[col.name] = opt.filtervalues[col.id] = tmp;
			}

			opt.colsfilter[col.name] = col;
		}

		cols.quicksort('index');
		opt.cols = cols;
		self.rebindcss();
		prerender && self.rendercols();
		controls.hide();
	};

	self.rebindcss = function() {

		var cols = opt.cols;
		var css = [];
		var indexes = {};

		opt.width = (config.numbering !== false ? 40 : 0) + (config.checkbox ? 40 : 0) + 30;

		for (var i = 0; i < cols.length; i++) {
			var col = cols[i];

			if (!col.width)
				col.width = config.colwidth;

			css.push('.dg-{2} .dg-col-{0}{width:{1}px}'.format(i, col.width, self.IDCSS));

			if (!col.hidden) {
				opt.width += col.width;
				indexes[i] = opt.width;
			}
		}

		CSS(css, self.ID);

		var w = self.width();
		if (w > opt.width)
			opt.width = w - 2;

		if (sheader) {
			css = { width: opt.width };
			header.css(css);
			// vbody.css(css);
		}

		header && header.find('.dg-resize').each(function() {
			var el = $(this);
			el.css('left', indexes[el.attrd('index')] - 39);
		});
	};

	self.cols = function(callback) {
		callback(opt.cols);
		opt.cols.quicksort('index');
		self.rebindcss();
		self.rendercols();
		opt.rows && self.renderrows(opt.rows);
		self.save();
		opt.cluster && opt.cluster.update(opt.render);
		self.resize();
	};

	self.rendercols = function() {

		var Trow = '<div class="dg-hrow dg-row-{0}">{1}</div>';

		if (config.hfunc)
			config.numbering = '<div class="dg-hfunc dg-hfunc-main" data-value="-1"><i class="{0}"></i></div>'.format(self.faicon(config.hfuncicon));

		var column = config.numbering !== false ? Theadercol({ index: -1, label: config.numbering, filter: false, name: '$', sorting: false }) : '';
		var resize = [];

		opt.width = (config.numbering !== false ? 40 : 0) + (config.checkbox ? 40 : 0) + 30;

		if (config.checkbox)
			column += Theadercol({ index: -1, label: '<div class="dg-checkbox dg-checkbox-main" data-value="-1"><i class="ti ti-check"></i></div>', filter: false, name: '$', sorting: false });

		for (var i = 0; i < opt.cols.length; i++) {
			var col = opt.cols[i];
			if (!col.hidden) {
				var filteritems = col.options ? col.options instanceof Array ? col.options : GET(self.makepath(col.options)) : null;
				var filtervalue = opt.filtervalues[col.id];
				var obj = { index: i, ts: NOW.getTime(), label: col.header(col), filter: col.filter, reorder: config.reorder, sorting: col.sorting, name: col.name, alignfilter: col.alignfilter, alignheader: col.alignheader, filterval: filtervalue == null ? null : filteritems ? filteritems.findValue(col.ovalue, filtervalue, col.otext, '???') : filtervalue, labeltitle: col.title || col.text, options: filteritems };
				opt.width += col.width;
				config.resize && resize.push('<span class="dg-resize" style="left:{0}px" data-index="{1}"></span>'.format(opt.width - 39, i));
				column += Theadercol(obj);
			}
		}

		column += '<div class="dg-hcol"></div>';
		header[0].innerHTML = resize.join('') + Trow.format(0, column);

		var w = self.width();
		if (w > opt.width)
			opt.width = w;

		self.redrawsorting();
	};

	self.redraw = function(update) {
		var x = self.scrollbarX.scrollLeft();
		var y = self.scrollbarY ? self.scrollbarY.scrollTop() : 0;
		isredraw = update ? 2 : 1;
		self.refreshfilter();
		isredraw = 0;
		self.scrollbarX.scrollLeft(x);
		self.scrollbarY && self.scrollbarY.scrollTop(y);
	};

	self.redrawrow = function(oldrow, newrow) {
		var index = opt.rows.indexOf(oldrow);
		if (index !== -1) {

			controls.cache = {};

			// Replaces old row with a new
			if (newrow) {
				if (self.selected === oldrow)
					self.selected = newrow;
				oldrow = opt.rows[index] = newrow;
			}

			var el = vbody.find('.dg-row[data-index="{0}"]'.format(index));
			if (el.length) {
				opt.render[index] = $(self.renderrow(index, oldrow))[0];
				el[0].parentNode.replaceChild(opt.render[index], el[0]);
			}
		}
	};

	self.appendrow = function(row, scroll, prepend) {

		var index = prepend ? 0 : (opt.rows.push(row) - 1);
		var model = self.get();

		controls.cache = {};

		if (model == null) {
			// bad
			return;
		} else {
			var arr = model.items ? model.items : model;
			if (prepend) {
				arr.unshift(row);
			} else if (model.items)
				arr.push(row);
			else
				arr.push(row);
		}

		if (prepend) {
			var tmp;
			// modifies all indexes
			for (var i = 0; i < opt.render.length; i++) {
				var node = opt.render[i];
				if (typeof(node) === 'string')
					node = opt.render[i] = $(node)[0];
				var el = $(node);
				var tmpindex = i + 1;
				tmp = el.rclass2('dg-row-').aclass('dg-row-' + tmpindex).attrd('index', tmpindex);
				tmp.find('.dg-number').html(tmpindex + 1);
				tmp.find('.dg-checkbox-main').attrd('value', tmpindex);
				if (opt.rows[i])
					opt.rows[i].ROW = tmpindex;
			}
			row.ROW = index;
			tmp = {};
			var keys = Object.keys(opt.checked);
			for (var i = 0; i < keys.length; i++)
				tmp[(+keys[i]) + 1] = 1;
			opt.checked = tmp;
			opt.render.unshift(null);
		}

		opt.render[index] = $(self.renderrow(index, row))[0];
		opt.cluster && opt.cluster.update(opt.render, !opt.scroll || opt.scroll === '-');
		if (scroll) {
			var el = opt.cluster.el[0];
			el.scrollTop = el.scrollHeight;
		}
		self.scrolling();
	};

	self.renderrow = function(index, row, plus) {

		if (plus === undefined && config.exec) {
			// pagination
			var val = self.get();
			plus = (val.page - 1) * val.limit;
		}

		var Trow = '<div><div class="dg-row dg-row-{0}{3}{4}" data-index="{2}">{1}</div></div>';
		var Tcol = '<div class="dg-col dg-col-{0}{2}{3}">{1}</div>';
		var column = '';

		if (config.numbering !== false)
			column += Tcol.format(-1, '<div class="dg-number">{0}</div>'.format(index + 1 + (plus || 0)));

		if (config.checkbox)
			column += Tcol.format(-1, '<div class="dg-checkbox-main dg-checkbox{1}" data-value="{0}"><i class="ti ti-check"></i></div>'.format(row.ROW, opt.checked[row.ROW] ? ' dg-checked' : ''));

		for (var j = 0; j < opt.cols.length; j++) {
			var col = opt.cols[j];
			if (!col.hidden)
				column += Tcol.format(j, col.template(row), col.align, row.CHANGES && row.CHANGES[col.name] ? ' dg-col-changed' : '');
		}

		column += '<div class="dg-col">&nbsp;</div>';
		var rowcustomclass = opt.rowclasstemplate ? opt.rowclasstemplate(row) : '';
		return Trow.format(index + 1, column, index, self.selected === row ? ' dg-selected' : '', (row.CHANGES ? ' dg-row-changed' : '') + (rowcustomclass || ''));
	};

	self.renderrows = function(rows, noscroll) {

		opt.rows = rows;
		controls.cache = {};

		var output = [];
		var plus = 0;

		if (config.exec) {
			// pagination
			var val = self.get();
			plus = (val.page - 1) * val.limit;
		}

		var is = false;

		for (var i = 0, length = rows.length; i < length; i++) {
			var row = rows[i];
			if (!is && self.selected) {
				if (self.selected === row) {
					is = true;
				} else if (config.clickid && self.selected[config.clickid] === row[config.clickid]) {
					self.selected = row;
					is = true;
				}
			}

			output.push(self.renderrow(i, rows[i], plus));
		}

		var min = ((((opt.height || config.minheight) - 120) / config.rowheight) >> 0) + 1;
		var is = output.length < min;
		if (is) {
			for (var i = output.length; i < min + 1; i++)
				output.push('<div class="dg-row-empty">&nbsp;</div>');
		}

		self.tclass('dg-noscroll', is);

		if (noscroll) {
			self.scrollbarX.scrollLeft(0);
			self.scrollbarY && self.scrollbarY.scrollTop(0);
		}

		opt.render = output;
		self.onrenderrows && self.onrenderrows(opt);
	};

	self.exportrows = function(page_from, pages_count, callback, reset_page_to, sleep) {

		var arr = [];
		var source = self.get();

		if (reset_page_to === true)
			reset_page_to = source.page;

		if (page_from === true)
			reset_page_to = source.page;

		pages_count = page_from + pages_count;

		if (pages_count > source.pages)
			pages_count = source.pages;

		for (var i = page_from; i < pages_count + 1; i++)
			arr.push(i);

		!arr.length && arr.push(page_from);

		var index = 0;
		var rows = [];

		arr.wait(function(page, next) {
			opt.scroll = (index++) === 0 ? 'xy' : '';
			self.get().page = page;
			self.operation('page');
			self.onrenderrows = function(opt) {
				rows.push.apply(rows, opt.rows);
				setTimeout(next, sleep || 100);
			};
		}, function() {
			self.onrenderrows = null;
			callback(rows, opt);
			if (reset_page_to > 0) {
				self.get().page = reset_page_to;
				self.operation('page');
			}
		});
	};

	self.reordercolumn = function(index, position) {

		var col = opt.cols[index];
		if (!col)
			return;

		var old = col.index;

		opt.cols[index].index = position + (old < position ? 0.2 : -0.2);
		opt.cols.quicksort('index');

		for (var i = 0; i < opt.cols.length; i++) {
			col = opt.cols[i];
			col.index = i;
		}

		opt.cols.quicksort('index');

		self.rebindcss();
		self.rendercols();
		self.renderrows(opt.rows);
		opt.sort && opt.sort.sort && self.redrawsorting();
		opt.cluster && opt.cluster.update(opt.render, true);
		self.scrolling();

		controls.hide();
		config.remember && self.save();
	};

	self.resizecolumn = function(index, size) {
		opt.cols[index].width = size;
		self.rebindcss();
		config.remember && self.save();
		self.resize();
	};

	self.save = function() {

		var cache = {};

		for (var i = 0; i < opt.cols.length; i++) {
			var col = opt.cols[i];
			col.index = i;
			cache[col.realindex] = { index: col.index, width: col.width, hidden: col.hidden };
		}

		if (W.PREF)
			W.PREF.set(self.gridid, cache, '1 month');
		else
			CACHE(self.gridid, cache, '1 month');
	};

	self.rows = function() {
		return opt.rows.slice(0);
	};

	var resizecache = {};

	self.resize = function() {
		setTimeout2(self.ID + 'resize', self.resizeforce, 100);
	};

	self.resizeforce = function() {

		if (!opt.cols || HIDDEN(self.dom)) {
			resizecache.timeout && clearTimeout(resizecache.timeout);
			resizecache.timeout = setTimeout(self.resizeforce, ready ? 1000 : 400);
			return;
		}

		if (resizecache.timeout) {
			clearTimeout(resizecache.timeout);
			resizecache.timeout = null;
		}

		var el;
		var footerh = opt.footer = footer.length ? footer.height() : 0;

		if (typeof(config.height) === 'string' && config.height.substring(0, 6) === 'parent') {

			el = self.element.parent();

			var count = +config.height.substring(6);
			if (count) {
				for (var i = 0; i < count; i++)
					el = el.parent();
			}

			opt.height = (el.height() - config.margin);

		} else {
			switch (config.height) {
				case 'auto':
					var wh = config.parent ? self.parent(config.parent).height() : WH;
					el = self.element;
					opt.height = (wh - (el.offset().top + config.margin));
					break;
				case 'window':
					opt.height = WH - config.margin;
					break;
				case 'fluid':
					opt.height = ((opt.rows ? opt.rows.length : 0) * config.rowheight) + header.outerHeight() + 6;
					break;
				default:

					if (config.height > 0) {
						opt.height = config.height;
					} else {
						el = self.element.closest(config.height);
						opt.height = ((el.length ? el.height() : 200) - config.margin);
					}
					break;
			}
		}

		var mr = (vbody.parent().css('margin-right') || '').parseInt();
		var h = opt.height - footerh;
		var sh = SCROLLBARWIDTH();
		controls.hide();

		var mh = config.minheight;
		if (h < mh)
			h = mh;

		var ismobile = isMOBILE && isTOUCH;

		if (resizecache.mobile !== ismobile && !config.noborder) {
			resizecache.mobile = ismobile;
			self.tclass('dg-mobile', ismobile);
		}

		if (resizecache.h !== h) {
			resizecache.h = h;
			sheader.css('height', h);
		}

		var tmpsh = h - (sh ? (sh + self.scrollbarX.thinknessX - 2) : (footerh - 2));
		resizecache.tmpsh = h;
		sbody.css('height', tmpsh + self.scrollbarX.marginY + (config.exec && self.scrollbarX.size.empty ? footerh : 0));

		var w;

		if (config.fullwidth_xs && WIDTH() === 'xs' && isMOBILE) {
			var isfrm = false;
			try {
				isfrm = W.self !== W.top;
			} catch (e) {
				isfrm = true;
			}
			if (isfrm) {
				w = screen.width - (self.element.offset().left * 2);
				if (resizecache.wmd !== w) {
					resizecache.wmd = w;
					self.css('width', w);
				}
			}
		}

		if (w == null)
			w = self.width();

		var emptyspace = 50 - mr;
		if (emptyspace < 50)
			emptyspace = 50;

		var width = (config.numbering !== false ? 40 : 0) + (config.checkbox ? 40 : 0) + emptyspace;

		for (var i = 0; i < opt.cols.length; i++) {
			var col = opt.cols[i];
			if (!col.hidden)
				width += col.width + 1;
		}

		if (w > width)
			width = w - 2;

		if (resizecache.hc !== h) {
			resizecache.hc = h;
			container.css('height', h);
		}

		if (resizecache.width !== width) {
			resizecache.width = width;
			header.css('width', width);
			vbody.css('width', width);
			sbody.css('width', width);
			opt.width2 = w;
		}

		opt.height = h + footerh;
		self.scrollbarX.resize();
		self.scrollbarY && self.scrollbarY.resize();

		ready = true;
		// header.parent().css('width', self.scrollbar.area.width());
	};

	self.refreshfilter = function(useraction) {

		// Get data
		var obj = self.get() || EMPTYARRAY;
		var items = (obj instanceof Array ? obj : obj.items) || EMPTYARRAY;
		var output = [];

		if (isredraw) {
			if (isredraw === 2) {
				self.fn_in_checked();
				self.fn_in_changed();
			}
		} else {
			opt.checked = {};
			config.checkbox && header.find('.dg-checkbox-main').rclass('dg-checked');
			self.fn_in_checked(EMPTYARRAY);
		}

		for (var i = 0; i < items.length; i++) {
			var item = items[i];

			item.ROW = i;

			if (!config.exec) {
				if (opt.filter && !self.filter(item))
					continue;
				if (opt.search) {
					for (var j = 0; j < opt.cols.length; j++) {
						var col = opt.cols[j];
						if (col.search)
							item['$' + col.name] = col.search(item);
					}
				}
			}

			output.push(item);
		}

		if (!isredraw) {

			if (opt.scroll) {

				if (self.scrollbarY && (/y/).test(opt.scroll))
					self.scrollbarY.scrollTop(0);

				if ((/x/).test(opt.scroll)) {
					if (useraction)	{
						var sl = self.scrollbarX.scrollLeft();
						self.scrollbarX.scrollLeft(sl ? sl - 1 : 0);
					} else
						self.scrollbarX.scrollLeft(0);
				}

				opt.scroll = '';
			}

			if (opt.sort != null) {
				if (!config.exec)
					opt.sort.sort && output.quicksort(opt.sort.name, opt.sort.sort === 1);
				self.redrawsorting();
			}
		}

		self.resize();
		self.renderrows(output, isredraw);

		setTimeout(self.resize, 100);
		opt.cluster && opt.cluster.update(opt.render, !opt.scroll || opt.scroll === '-');
		self.scrolling();

		if (isredraw) {
			if (isredraw === 2) {
				// re-update all items
				self.select(self.selected || null);
			}
		} else {
			var sel = self.selected;
			if (config.autoselect && output && output.length) {
				setTimeout(function() {
					var index = sel ? output.indexOf(sel) : 0;
					if (index === -1)
						index = 0;
					self.select(output[index]);
				}, 1);
			} else {
				var index = sel ? output.indexOf(sel) : -1;
				self.select(index === -1 ? null : output[index]);
			}
		}
	};

	self.redrawsorting = function() {
		var arr = self.find('.dg-sorting');
		for(var i = 0; i < arr.length; i++) {
			var el = $(arr[i]);
			var col = opt.cols[+el.attrd('index')];
			if (col) {
				var ti = el.find('.dg-sort').rclass2('ti-');
				switch (col.sort) {
					case 1:
						ti.aclass('ti-arrow-up');
						break;
					case 2:
						ti.aclass('ti-arrow-down');
						break;
					default:
						ti.aclass('ti-arrows-v');
						break;
				}
			}
		}
		controls.hide();
	};

	self.resetcolumns = function() {

		if (W.PREF)
			W.PREF.set(self.gridid);
		else
			CACHE(self.gridid, null, '-1 day');

		self.rebind(opt.declaration);
		self.cols(NOOP);
		ecolumns.aclass('hidden');
		isecolumns = false;
		controls.hide();
	};

	self.redrawcolumns = function() {
		self.rebind(opt.declaration);
		self.cols(NOOP);
		ecolumns.aclass('hidden');
		isecolumns = false;
		controls.hide();
	};

	self.resetfilter = function() {
		opt.filter = {};
		opt.filtercache = {};
		opt.filtercl = {};
		opt.filtervalues = {};
		opt.cols && self.rendercols();
		if (config.exec)
			self.operation('refresh');
		else
			self.refresh();
		controls.hide();
	};

	var pagecache = { pages: -1, count: -1 };

	self.redrawpagination = function() {

		if (!config.exec || !config.pagination)
			return;

		var value = self.get();

		if (!value.page)
			value.page = 1;

		if (value.pages == null)
			value.pages = 0;

		if (value.count == null)
			value.count = 0;

		var is = false;

		if (value.page === 1 || (value.pages != null && value.count != null)) {
			pagecache.pages = value.pages;
			pagecache.count = value.count;
			is = true;
		}

		footer.find('button').each(function() {

			var el = $(this);
			var dis = true;

			switch (this.name) {
				case 'page-next':
					dis = value.page >= pagecache.pages;
					break;
				case 'page-prev':
					dis = value.page === 1;
					break;
				case 'page-last':
					dis = !value.page || value.page >= pagecache.pages;
					break;
				case 'page-first':
					dis = value.page === 1;
					break;
			}

			el.prop('disabled', dis);
		});

		footer.find('input')[0].value = value.page;

		if (is) {
			var num = pagecache.pages || 0;
			footer.find('.dg-pagination-pages')[0].innerHTML = num.pluralize.apply(num, config.pluralizepages);
			num = pagecache.count || 0;
			footer.find('.dg-pagination-items')[0].innerHTML = num.pluralize.apply(num, config.pluralizeitems);
		}

		footer.rclass('hidden');
	};

	self.setter = function(value, path, type) {

		if (!ready) {
			setTimeout(self.setter, 100, value, path, type);
			return;
		}

		controls.hide();

		if (config.exec && (value == null || (config.pagination && value.items == null))) {

			if (value && W.ERROR && ERROR(value))
				return;

			self.operation('refresh');
			if (config.pagination) {
				if (value && value.items == null)
					value.items = [];
				else
					return;
			} else
				return;
		}

		if (value && value.schema && schemas.$current !== value.schema) {
			self.rebind(value.schema, true);
			setTimeout(function() {
				self.setter(value, path, type);
			}, 100);
			return;
		}

		if (!opt.cols)
			return;

		opt.checked = {};

		if (forcescroll) {
			opt.scroll = forcescroll;
			forcescroll = '';
		} else
			opt.scroll = type !== 'noscroll' && !self.isloading ? 'xy' : '';

		self.applycolumns();
		self.refreshfilter();
		self.redrawsorting();
		self.redrawpagination();
		self.fn_in_changed();
		!config.exec && self.rendercols();
		setTimeout2(self.ID + 'resize', self.resize, 100);

		if (opt.cluster)
			return;

		config.exec && self.rendercols();
		opt.cluster = new Cluster(vbody, config);
		opt.cluster.grid = self;
		opt.cluster.scroll = self.scrolling;
		opt.render && opt.cluster.update(opt.render);
		self.aclass('dg-visible');
	};

	self.scrolling = function() {
		config.checkbox && setTimeout2(self.ID, function() {
			vbody.find('.dg-checkbox-main').each(function() {
				$(this).tclass('dg-checked', opt.checked[this.getAttribute('data-value')] == 1);
			});
		}, 80, 10);
	};

	var REG_STRING = /\/\|\\|,/;
	var REG_DATE1 = /\s-\s/;
	var REG_DATE2 = /\/|\||\\|,/;
	var REG_SPACE = /\s/g;

	self.filter = function(row) {
		var keys = Object.keys(opt.filter);
		for (var i = 0; i < keys.length; i++) {

			var column = keys[i];
			var filter = opt.filter[column];
			var val2 = opt.filtercache[column];
			var val = row['$' + column] || row[column];
			var type = typeof(val);

			if (val instanceof Array) {
				val = val.join(' ');
				type = 'string';
			} else if (val && type === 'object' && !(val instanceof Date)) {
				val = JSON.stringify(val);
				type = 'string';
			}

			if (type === 'number') {

				if (val2 == null)
					val2 = opt.filtercache[column] = typeof(filter) === 'number' ? [filter] : self.parseNumber(filter + '');

				if (val2.length === 1 && val !== val2[0])
					return false;

				if (val < val2[0] || val > val2[1])
					return false;

			} else if (type === 'string') {

				var is = false;

				if (opt.filtercl[column] != null) {
					is = opt.filtercl[column] == val;
					if (!is)
						return false;
				}

				var col = opt.colsfilter[column];

				if (val2 == null) {
					val2 = opt.filtercache[column] = filter.split(REG_STRING).trim();
					if (!col.filtertype) {
						for (var j = 0; j < val2.length; j++)
							val2[j] = val2[j].toSearch();
					}
				}

				var s = col.filtertype ? val : val.toSearch();

				for (var j = 0; j < val2.length; j++) {
					if (s.indexOf(val2[j]) !== -1) {
						is = true;
						break;
					}
				}

				if (!is)
					return false;

			} else if (type === 'boolean') {
				if (val2 == null)
					val2 = opt.filtercache[column] = typeof(filter) === 'string' ? config.boolean.indexOf(filter.replace(REG_SPACE, '')) !== -1 : filter;
				if (val2 !== val)
					return false;
			} else if (val instanceof Date) {

				val.setHours(0);
				val.setMinutes(0);

				if (val2 == null) {

					val2 = filter.trim().replace(REG_DATE1, '/').split(REG_DATE2).trim();
					var arr = opt.filtercache[column] = [];

					for (var j = 0; j < val2.length; j++) {
						var dt = val2[j].trim();
						var a = self.parseDate(dt, j === 1);
						if (a instanceof Array) {
							if (val2.length === 2) {
								arr.push(j ? a[1] : a[0]);
							} else {
								arr.push(a[0]);
								if (j === val2.length - 1) {
									arr.push(a[1]);
									break;
								}
							}
						} else
							arr.push(a);
					}

					if (val2.length === 2 && arr.length === 2) {
						arr[1].setHours(23);
						arr[1].setMinutes(59);
						arr[1].setSeconds(59);
					}

					val2 = arr;
				}

				if (val2.length === 1) {
					if (val2[0].YYYYMM)
						return val.format('yyyyMM') === val2[0].format('yyyyMM');
					if (val.format('yyyyMMdd') !== val2[0].format('yyyyMMdd'))
						return false;
				}

				if (val < val2[0] || val > val2[1])
					return false;

			} else
				return false;
		}

		return true;
	};

	self.checked = function() {
		var arr = Object.keys(opt.checked);
		var output = [];
		var model = self.get() || EMPTYARRAY;
		var rows = model instanceof Array ? model : model.items;
		for (var i = 0; i < arr.length; i++) {
			var index = +arr[i];
			output.push(rows[index]);
		}
		return output;
	};

	self.readfilter = function() {
		return opt.filter;
	};

	self.changed = function() {
		var output = [];
		var model = self.get() || EMPTYARRAY;
		var rows = model instanceof Array ? model : model.items;
		for (var i = 0; i < rows.length; i++)
			rows[i].CHANGES && output.push(rows[i]);
		return output;
	};

	self.parseDate = function(val, second) {

		var index = val.indexOf('.');
		var m, y, d, a, special, tmp;

		if (index === -1) {
			if ((/[a-z]+/).test(val)) {
				var dt;
				try {
					dt = NOW.add(val);
				} catch (e) {
					return [0, 0];
				}
				return dt > NOW ? [NOW, dt] : [dt, NOW];
			}
			if (val.length === 4)
				return [new Date(+val, 0, 1), new Date(+val + 1, 0, 1)];
		} else if (val.indexOf('.', index + 1) === -1) {
			a = val.split('.');
			if (a[1].length === 4) {
				y = +a[1];
				m = +a[0] - 1;
				d = second ? new Date(y, m, 0).getDate() : 1;
				special = true;
			} else {
				y = NOW.getFullYear();
				m = +a[1] - 1;
				d = +a[0];
			}

			tmp = new Date(y, m, d);
			if (special)
				tmp.YYYYMM = true;
			return tmp;
		}
		index = val.indexOf('-');
		if (index !== -1 && val.indexOf('-', index + 1) === -1) {
			a = val.split('-');
			if (a[0].length === 4) {
				y = +a[0];
				m = +a[1] - 1;
				d = second ? new Date(y, m, 0).getDate() : 1;
				special = true;
			} else {
				y = NOW.getFullYear();
				m = +a[0] - 1;
				d = +a[1];
			}

			tmp = new Date(y, m, d);

			if (special)
				tmp.YYYYMM = true;

			return tmp;
		}

		return val.parseDate();
	};

	var REG_NUM1 = /\s-\s/;
	var REG_COMMA = /,/g;
	var REG_NUM2 = /\/|\|\s-\s|\\/;

	self.parseNumber = function(val) {
		var arr = [];
		var num = val.replace(REG_NUM1, '/').replace(REG_SPACE, '').replace(REG_COMMA, '.').split(REG_NUM2).trim();
		for (var i = 0, length = num.length; i < length; i++) {
			var n = num[i];
			arr.push(+n);
		}
		return arr;
	};

	self.datagrid_cancel = function(meta, force) {
		var current = self.editable;
		if (current && current.is) {
			current.is = false;
			force && current.el.replaceWith(current.backup);
			current.input && current.input.off();
			$(W).off('keydown', current.fn).off('click', current.fn);
		}
	};

	self.datagrid_edit = function(meta, next) {

		if (!meta || !meta.col.editable)
			return;

		if (!self.editable)
			self.editable = {};

		var el = meta.elcol;
		var current = self.editable;
		current.is && self.datagrid_cancel(meta, true);
		current.is = true;

		current.backup = el.find('.dg-editable').aclass('dg-editable').clone();
		el = el.find('.dg-editable');

		if (!meta.col.type) {
			if (meta.value instanceof Date)
				meta.col.type = 'date';
			else
				meta.col.type = typeof(meta.value);
		}

		if (typeof(meta.col.editable) === 'string') {
			meta.next = function(value) {
				if (value !== undefined)
					meta.value = value;
				next(meta);
				self.datagrid_cancel(meta);
			};
			meta.cancel = function() {
				self.datagrid_cancel(meta);
			};
			self.EXEC(meta.col.editable, meta);
			return;
		}

		if (meta.col.options) {
			current.el = el;
			var opt = {};
			opt.element = el;
			opt.items = meta.col.options;

			if (typeof(opt.items) === 'string')
				opt.items = self.makepath(opt.items);

			opt.key = meta.col.otext;
			opt.placeholder = meta.col.dirsearch ? meta.col.dirsearch : '';
			if (meta.col.dirsearch === false)
				opt.search = false;
			opt.callback = function(item) {
				current.is = false;
				meta.value = item[meta.col.ovalue];
				next(meta);
				self.datagrid_cancel(meta);
			};
			SETTER('directory', 'show', opt);
			return;
		}

		var align = meta.col.align;
		el.rclass('dg-value').html(meta.col.type.substring(0, 4) === 'bool' ? '<div{1}><div class="dg-checkbox{0}" data-custom="2"><i class="ti ti-check"></i></div></div>'.format(meta.value ? ' dg-checked' : '', align ? (' class="' + align.trim() + '"') : '') : '<input type="{0}" maxlength="{1}"{2} />'.format(meta.col.ispassword ? 'password' : 'text', meta.col.maxlength || 100, align ? (' class="' + align.trim() + '"') : ''));
		current.el = el;

		var input = meta.elcol.find('input');
		input.val(meta.value instanceof Date ? meta.value.format(meta.col.format) : meta.value);
		input.focus();
		current.input = input;

		if (meta.col.type === 'date') {
			// DATE
			var opt = {};
			opt.element = el;
			opt.value = meta.value;
			opt.callback = function(date) {
				current.is = false;
				meta.value = date;
				next(meta);
				self.datagrid_cancel(meta);
			};
			SETTER('datepicker', 'show', opt);
		}

		current.fn = function(e) {

			if (!current.is)
				return;

			if (e.type === 'click') {
				if (e.target.tagName === 'INPUT')
					return;
				e.preventDefault();
				e.keyCode = 13;
				if (meta.col.type === 'date') {
					e.type = 'keydown';
					setTimeout(current.fn, 800, e);
					return;
				} else if (meta.col.type.substring(0, 4) === 'bool') {
					var tmp = $(e.target);
					var is = tmp.hclass('dg-checkbox');
					if (!is) {
						tmp = tmp.closest('.dg-checkbox');
						is = tmp.length;
					}
					if (is) {
						meta.value = tmp.hclass('dg-checked');
						next(meta);
						self.datagrid_cancel(meta);
						return;
					}
				}
			}

			switch (e.keyCode) {
				case 13: // ENTER
				case 9: // TAB

					var val = input.val();
					if (val == meta.value) {
						next = null;
						self.datagrid_cancel(meta, true);
					} else {

						if (meta.col.type === 'number') {
							val = val.parseFloat();
							if (val == meta.value || (meta.min != null && meta.min > val) || (meta.max != null && meta.max < val)) {
								next = null;
								self.datagrid_cancel(meta, true);
								return;
							}
						} else if (meta.col.type === 'date') {

							val = val.parseDate(meta.format ? meta.format.env() : undefined);

							if (!val || isNaN(val.getTime()))
								val = null;

							if (val && meta.value && val.getTime() === meta.value.getTime()) {
								next = null;
								self.datagrid_cancel(meta, true);
								return;
							}
						}

						if (meta.col.required && (val == null || val === '')) {
							// WRONG VALUE
							self.datagrid_cancel(meta, true);
							return;
						}

						meta.value = val;
						next(meta);
						self.datagrid_cancel(meta);
					}

					if (e.which === 9) {

						// tries to edit another field
						var elcol = meta.elcol;

						while (true) {
							elcol = elcol.next();
							if (!elcol.length)
								break;

							var eledit = elcol.find('.dg-editable');
							if (eledit.length) {
								setTimeout(function(meta, elcol) {
									self.editcolumn(meta.rowindex, +elcol.attr('class').match(/\d+/)[0]);
								}, 200, meta, elcol);
								break;
							}
						}
					}

					break;

				case 27: // ESC
					next = null;
					self.datagrid_cancel(meta, true);
					break;
			}
		};

		$(W).on('keydown', current.fn).on('click', current.fn);
	};
});

COMPONENT('confirm', function(self, config, cls) {

	var cls2 = '.' + cls;
	var is;
	var events = {};

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		self.aclass(cls + ' hidden');

		self.event('click', 'button', function() {
			self.hide(+$(this).attrd('index'));
		});

		self.event('click', cls2 + '-close', function() {
			self.callback = null;
			self.hide(-1);
		});

		self.event('click', function(e) {
			var t = e.target.tagName;
			if (t !== 'DIV')
				return;
			var el = self.find(cls2 + '-body');
			el.aclass(cls + '-click');
			setTimeout(function() {
				el.rclass(cls + '-click');
			}, 300);
		});
	};

	events.keydown = function(e) {
		var index = e.which === 13 ? 0 : e.which === 27 ? 1 : null;
		if (index != null) {
			self.find('button[data-index="{0}"]'.format(index)).trigger('click');
			e.preventDefault();
			e.stopPropagation();
			events.unbind();
		}
	};

	events.bind = function() {
		$(W).on('keydown', events.keydown);
	};

	events.unbind = function() {
		$(W).off('keydown', events.keydown);
	};

	self.show2 = function(message, buttons, fn) {
		self.show(message, buttons, function(index) {
			!index && fn();
		});
	};

	self.show = self.confirm = function(message, buttons, fn) {

		if (M.scope)
			self.currscope = M.scope();

		self.callback = fn;

		var builder = [];

		for (var i = 0; i < buttons.length; i++) {
			var item = buttons[i];
			var icon = item.match(/"[a-z0-9-\s]+"/);
			if (icon) {

				var tmp = icon + '';
				if (tmp.indexOf(' ') == -1)
					tmp = 'ti ti-' + tmp;

				item = item.replace(icon, '').trim();
				icon = '<i class="{0}"></i>'.format(tmp.replace(/"/g, ''));
			} else
				icon = '';

			var color = item.match(/#[0-9a-f]+/i);
			if (color)
				item = item.replace(color, '').trim();

			builder.push('<button data-index="{1}"{3}>{2}{0}</button>'.format(item, i, icon, color ? ' style="background:{0}"'.format(color) : ''));
		}

		self.content('<div class="{0}-message">{1}</div>{2}'.format(cls, message.replace(/\n/g, '<br />'), builder.join('')));
	};

	self.hide = function(index) {
		self.currscope && M.scope(self.currscope);
		self.callback && self.callback(index);
		self.rclass(cls + '-visible');
		events.unbind();
		setTimeout2(self.id, function() {
			$('html').rclass(cls + '-noscroll');
			self.aclass('hidden');
		}, 1000);
	};

	self.content = function(text) {
		$('html').aclass(cls + '-noscroll');
		!is && self.html('<div><div class="{0}-body"><span class="{0}-close"><i class="ti ti-times"></i></span></div></div>'.format(cls));
		self.find(cls2 + '-body').append(text);
		self.rclass('hidden');
		events.bind();
		setTimeout2(self.id, function() {
			self.aclass(cls + '-visible');
			document.activeElement && document.activeElement.blur();
		}, 5);
	};
});

COMPONENT('filter', 'reset:Reset;apply:Apply;cancel:Cancel', function(self, config, cls) {

	var cls2 = '.' + cls;
	var events = {};
	var is = false;
	var container, timeout, prev;
	var regnohide = /ui-datepicker|ui-timepicker|ui-directory|ui-filter/g;

	var autohide = function(e) {
		var tmp = e.target;
		while (tmp) {
			if (tmp.tagName === 'BODY' || tmp.tagName === 'HTML' || !tmp.getAttribute)
				break;
			var cc = tmp.getAttribute('class');
			if (regnohide.test(cc))
				return false;
			tmp = tmp.parentNode;
		}
		return true;
	};

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();

	self.bindevents = function() {
		if (!is) {
			$(W).on('scroll', events.resize).on('resize', events.resize);
			$(document).on('click', events.click);
			is = true;
		}
	};

	self.unbindevents = function() {
		if (is) {
			is = false;
			$(W).off('scroll', events.resize).off('resize', events.resize);
			$(document).off('click', events.click);
		}
	};

	events.click = function(e) {
		if (autohide(e))
			self.hide(1);
	};

	self.make = function() {
		self.aclass(cls + ' hidden');
		self.append('<div class="' + cls + '-items"></div><div class="' + cls + '-buttons"><button name="reset">{reset}</button><button name="apply"><i class="ti ti-filter"></i>{apply}</button><button name="cancel">{cancel}</button></div>'.arg(config));
		container = self.find(cls2 + '-items');

		self.event('keydown', 'input', function(e) {
			if (e.which === 13 && self.opt && self.opt.enter)
				setTimeout2(self.ID + 'enter', self.apply, 200);
		});

		self.event('click', 'button', function(e) {
			e.preventDefault();
			var t = this;
			if (t.name === 'cancel') {
				self.hide(1);
			} else if (t.name === 'reset') {

				for (var i = 0; i < self.opt.items.length; i++) {
					var item = self.opt.items[i];
					var key = item.name || item.label;
					delete self.opt.value[key];
				}

				self.opt.callback(self.opt.value, null, null, false);
				self.hide(1);
			} else {

				var obj = {};
				var changed = [];
				var keys = [];
				var is = false;

				for (var i = 0; i < self.opt.items.length; i++) {
					var item = self.opt.items[i];
					var key = item.name || item.label;
					if (item.current != undefined) {
						if (self.opt.clean && item.type === Boolean && item.current === false) {
							item.current = undefined;
							delete self.opt.value[key];
							delete obj[key];
						} else
							self.opt.value[key] = obj[key] = item.current;
						item.changed && changed.push(key);
					} else {
						delete self.opt.value[key];
						item.changed && changed.push(key);
					}

					keys.push(key);
				}

				for (var i = 0; i < keys.length; i++) {
					if (self.opt.value[keys[i]] != null) {
						is = true;
						break;
					}
				}

				self.opt.callback(self.opt.value, changed, keys, is);
				self.hide(1);
			}
		});

		self.event('change', 'input', function() {
			var el = $(this);
			el = el.closest(cls2 + '-item');
			self.val(el, this.value);
		});

		self.event('input', 'input', function() {
			var t = this;
			if (t.$prev != t.value) {
				t.$prev = t.value;
				$(t).closest(cls2 + '-item').find(cls2 + '-placeholder').tclass('hidden', !!t.value);
			}
		});

		self.event('click', cls2 + '-checkbox', function() {
			var el = $(this);
			var is = !el.hclass(cls + '-checkbox-checked');
			el = el.closest(cls2 + '-item');
			self.val(el, is);
		});

		self.event('click', cls2 + '-icon-click,' + cls2 + '-placeholder', function() {

			var el = $(this).closest(cls2 + '-item');
			var item = self.opt.items[+el.attrd('index')];
			var opt;

			if (item.type === Date) {
				opt = {};
				opt.offsetX = -5;
				opt.offsetY = -5;
				opt.value = item.current || NOW;
				opt.element = el.find('input');
				opt.callback = function(date) {
					self.val(el, date);
				};
				SETTER('datepicker', 'show', opt);
			} else if (item.type instanceof Array) {
				el.find(cls2 + '-option').trigger('click');
			} else if (item.type === 'Time') {
				opt = {};
				opt.offsetX = -5;
				opt.offsetY = -5;
				opt.value = item.current || NOW;
				opt.element = el.find('input');
				opt.callback = function(date) {
					self.val(el, date);
				};
				SETTER('timepicker', 'show', opt);
			} else
				el.find('input').focus();
		});

		self.event('click', cls2 + '-option', function() {

			var el = $(this).closest(cls2 + '-item');
			var item = self.opt.items[+el.attrd('index')];
			var opt = {};

			opt.element = el;
			opt.items = item.type;
			opt.offsetWidth = -20;
			opt.placeholder = 'Search';
			opt.offsetX = 10;
			opt.offsetY = 10;
			opt.key = item.dirkey;

			if (item.dirempty || item.dirempty === '')
				opt.empty = item.dirempty || item.placeholder;

			opt.callback = function(selected, el, custom) {

				if (custom)
					return;

				if (typeof(selected) === 'string')
					self.val(opt.element, selected);
				else
					self.val(opt.element, selected ? selected[item.dirvalue] : null);
			};

			SETTER('directory', 'show', opt);
		});

		events.resize = function() {
			is && self.hide(1);
		};

		self.on('reflow', events.resize);
		self.on('scroll', events.resize);
		self.on('resize', events.resize);
	};

	self.val = function(el, val, init) {

		var item = self.opt.items[+el.attrd('index')];
		var type = typeof(val);
		var tmp;

		if (item.type instanceof Array) {
			if (typeof(item.type[0]) === 'string') {

				if (val === null) {
					// EMPTY
					el.find(cls2 + '-option').html('');
					item.current = undefined;
				} else {
					tmp = item.type.indexOf(val);
					if (tmp !== -1) {
						el.find(cls2 + '-option').html(val);
						item.current = val;
					}
				}

			} else {
				item.current = val;
				val = val == null ? '' : item.type.findValue(item.dirvalue, val, item.dirkey, '');
				el.find(cls2 + '-option').html(val);
			}
		} else {
			switch (item.type) {
				case Date:
					if (type === 'string')
						val = val ? val.parseDate(item.format) : '';
					break;
				case Number:
					if (type === 'string')
						val = val.parseFloat();
					break;
				case Boolean:
					el.find(cls2 + '-checkbox').tclass(cls + '-checkbox-checked', init ? val === true : val);
					break;
				case 'Time':
					if (type === 'string') {
						val = val ? val.parseDate(item.format) : '';
						item.current.setHours(val.getHours());
						item.current.setMinutes(val.getMinutes());
						item.current.setSeconds(val.getSeconds());
					}
					break;
			}
			item.current = val;
			val = val ? item.format ? val.format(item.format) : val : '';
			item.input && (el.find('input').val(val)[0].$prev = val);
		}

		if (!init)
			item.changed = true;

		item.placeholder && el.find(cls2 + '-placeholder').tclass('hidden', !!val);
	};

	self.show = function(opt) {

		var el = opt.element instanceof jQuery ? opt.element[0] : opt.element.element ? opt.element.dom : opt.element;

		if (is) {
			clearTimeout(timeout);
			if (self.target === el) {
				self.hide(1);
				return;
			}
		}

		if (!opt.value) {
			if (!el.$filter)
				el.$filter = {};
			opt.value = el.$filter;
		}

		var cache = JSON.stringify(opt.items);
		var isprerender = false;

		if (cache !== prev) {
			prev = cache;
			isprerender = true;
		}

		var builder = [];
		for (var i = 0; i < opt.items.length; i++) {
			var item = opt.items[i];
			var value = '';

			if (item.type instanceof Array) {
				value = '<div class="' + cls + '-option"></div>';
				item.icon = 'chevron-down';
				item.iconclick = true;

				if (!item.dirkey)
					item.dirkey = 'name';

				if (!item.dirvalue)
					item.dirvalue = 'id';

			} else {
				switch (item.type) {
					case Date:
						item.icon = 'calendar';
						item.input = true;
						item.iconclick = true;
						if (!item.format)
							item.format = 'yyyy–MM–dd';
						item.maxlength = item.format.length;
						break;
					case Number:
						item.input = true;
						item.iconclick = true;
						break;
					case String:
						item.input = true;
						item.iconclick = true;
						break;
					case Boolean:
						value = '<div class="{0}-checkbox"><i class="ti ti-check"></i></div>'.format(cls);
						break;
					case 'Time':
					case 'time':
						item.input = true;
						item.iconclick = true;
						item.icon = 'clock-o';
						if (!item.format)
							item.format = 'HH:mm';
						item.maxlength = item.format.length;
						break;
				}
			}

			if (isprerender) {

				if (item.input) {
					value = '<input type="text" />';
					if (item.maxlength)
						value = value.replace('/>', 'maxlength="' + item.maxlength + '" />');
				}

				if (item.icon)
					value = '<div class="{0}-item-icon{3}">{1}</div><div class="{0}-item-input">{2}</div>'.format(cls, item.icon.charAt(0) === '!' ? item.icon.substring(1) : '<i class="ti ti-{0}"></i>'.format(item.icon), value, item.iconclick ? (' ' + cls + '-icon-click') : '');

				builder.push('<div class="{0}-item" data-index="{3}"><div class="{0}-item-label">{1}</div><div class="{0}-item-value"><div class="{0}-placeholder">{4}</div>{2}</div></div>'.format(cls, item.label || item.name, value, i, item.placeholder || ''));
			}

			if (opt.value && !item.current)
				item.current = opt.value[item.name];
		}

		if (isprerender)
			container.html(builder.join(''));

		if (!opt.value)
			opt.value = {};

		self.opt = opt;
		self.target = el;

		self.find(cls2 + '-item').each(function() {
			var el = $(this);
			var index = +el.attrd('index');
			self.val(el, self.opt.items[index].current, true);
			if (!isprerender) {
				var t = el.find('input')[0];
				if (t) {
					t.$prev = t.value;
					el.find(cls2 + '-placeholder').tclass('hidden', !!t.value);
				}
			}
		});

		el = $(el);
		self.rclass('hidden');

		var css = {};
		var off = el.offset();
		var w = self.width();

		if (opt.element) {
			switch (opt.align) {
				case 'center':
					css.left = Math.ceil((off.left - w / 2) + (el.innerWidth() / 2));
					break;
				case 'right':
					css.left = (off.left - w) + el.innerWidth();
					break;
				default:
					css.left = off.left;
					break;
			}

			css.top = opt.position === 'bottom' ? (off.top - self.element.height() - 10) : (off.top + el.innerHeight() + 10);
		}

		css.width = opt.width || null;

		if (opt.offsetX)
			css.left += opt.offsetX;

		if (opt.offsetY)
			css.top += opt.offsetY;

		if (opt.autofocus !== false)
			self.autofocus();

		self.element.css(css);
		self.aclass(cls + '-visible', 100);
		setTimeout(self.bindevents, 500);
	};

	self.apply = function() {
		self.find('button[name="apply"]').trigger('click');
	};

	self.hide = function(sleep) {
		if (!is)
			return;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			self.unbindevents();
			self.rclass(cls + '-visible').aclass('hidden');
			if (self.opt)
				self.opt = null;
		}, sleep ? sleep : 100);
	};
});

COMPONENT('switchbutton', function(self, config, cls) {
	self.nocompile();

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : value === true;
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'disabled':
				!init && self.tclass('ui-disabled', value);
				break;
			case 'invalid':
				self.tclass(cls + '-invalid', value);
				break;
		}
	};

	self.make = function() {
		self.aclass(cls);
		self.html('<div class="{1}-label"><span>{0}</span>{2}</div><label tabindex=0><div class="{1}-slider"></div></label>'.format(self.html(), cls, config.description));

		self.event('click', function() {
			if (!config.disabled) {
				self.dirty(false);
				self.getter(!self.get());
			}
		});

		self.event('keydown', 'label', function(e) {
			if (!config.disabled && e.which === 32) {
				e.preventDefault();
				self.dirty(false);
				self.getter(!self.get());
			}
		});

		self.event('focusin focusout', 'label', function(e) {
			if (config.disabled)
				return;
			self.tclass(cls + '-focused', e.type === 'focusin');
		});

		config.align && self.aclass(cls + '-align-' + config.align);
		config.border && self.aclass(cls + '-border');
	};

	self.setter = function(value) {
		self.tclass(cls + '-checked', value === true);
	};
});

COMPONENT('directory', 'minwidth:200;create:Create', function(self, config, cls) {

	var cls2 = '.' + cls;
	var container, timeout, icon, plus, skipreset = false, skipclear = false, ready = false, input = null, issearch = false;
	var is = false, selectedindex = 0, resultscount = 0;
	var templateE = '{{ name | encode | ui_directory_helper }}';
	var templateR = '{{ name | raw }}';
	var template = '<li data-index="{{ $.index }}" data-search="{{ $.search }}" class="{{ $.classes }}">{{ if $.checkbox }}<span class="' + cls + '-checkbox"><i class="ti ti-check"></i></span>{{ fi }}{0}</li>';
	var templateraw = template.format(templateR);
	var regstrip = /(&nbsp;|<([^>]+)>)/ig;
	var parentclass = null;
	var parentclass2 = null;
	var skiphide = false;
	var skipmouse = false;
	var customvalue;
	var search;
	var main;

	template = template.format(templateE);

	Thelpers.ui_directory_helper = function(val) {
		var t = this;
		return t.template ? (typeof(t.template) === 'string' ? t.template.indexOf('{{') === -1 ? t.template : Tangular.render(t.template, this) : t.render(this, val)) : self.opt.render ? self.opt.render(this, val) : val;
	};

	self.template = Tangular.compile(template);
	self.templateraw = Tangular.compile(templateraw);

	self.readonly();
	self.singleton();
	self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'placeholder':
				self.find('input').prop('placeholder', value);
				break;
		}
	};

	self.make = function() {

		self.aclass('hidden ' + cls + '-area');
		self.append('<div class="{1}"><div class="{1}-search"><span class="{1}-add hidden"><i class="ti ti-plus"></i></span><span class="{1}-button"><i class="ti ti-search"></i></span><div><input type="text" placeholder="{0}" class="{1}-search-input" name="dir{2}" autocomplete="new-password" /></div></div><div class="{1}-container"><ul></ul></div></div>'.format(config.placeholder, cls, Date.now()));

		customvalue = $('<li data-index="-2"></li>')[0];

		main = self.find(cls2);
		container = self.find('ul');
		input = self.find('input');
		icon = self.find(cls2 + '-button').find('.ti');
		plus = self.find(cls2 + '-add');
		search = self.find(cls2 + '-search');

		self.event('mouseenter mouseleave', 'li', function() {
			if (ready && !issearch && !skipmouse) {
				container.find('li.current').rclass('current');
				$(this).aclass('current');
				var arr = container.find('li:visible');
				for (var i = 0; i < arr.length; i++) {
					if ($(arr[i]).hclass('current')) {
						selectedindex = i;
						break;
					}
				}
			}
		});

		self.element.on('click', function(e) {
			if (e.target === self.dom)
				self.hide(1);
		});

		var skiphidedelay;
		var skipmousedelay;
		var skipmousefalse = function() {
			skipmousedelay = null;
			skipmouse = false;
		};
		var skipmouseforce = function() {
			skipmouse = true;
			skipmousedelay && clearTimeout(skipmousedelay);
			skipmousedelay = setTimeout(skipmousefalse, 500);
		};

		self.event('focus', 'input', function() {

			skiphide = true;
			skiphidedelay && clearTimeout(skiphidedelay);
			skiphidedelay = setTimeout(function() {
				skiphide = false;
			}, 800);

			if (self.opt.search === false)
				$(this).blur();
		});

		self.event('click', cls2 + '-button', function(e) {
			skipclear = false;
			input.val('');
			self.search();
			e.stopPropagation();
			e.preventDefault();
		});

		self.event('click', cls2 + '-add', function() {
			if (self.opt.custom && self.opt.callback) {
				self.opt.scope && M.scope(self.opt.scope);
				self.opt.callback(input.val(), self.opt.element, true);
				self.hide();
			}
		});

		self.event('click', 'li', function(e) {

			var el = $(this);
			if (el.hclass('ui-disabled'))
				return;

			if (self.opt.callback) {

				self.opt.scope && M.scope(self.opt.scope);

				var index = +el.attrd('index');
				if (index === -2) {
					self.opt.scope && M.scope(self.opt.scope);
					self.opt.callback(input.val(), self.opt.element, true);
					self.hide();
					return;
				}

				var item = self.opt.items[index];

				if (self.opt.checkbox) {
					item.selected = !item.selected;

					if (item.selected)
						item.selectedts = Date.now();
					else
						delete item.selectedts;

					el.tclass('selected', item.selected);

					if (self.opt.checked) {
						var tmpindex = self.opt.checked.indexOf(item.id);
						if (item.selected) {
							if (tmpindex === -1)
								self.opt.checked.push(item.id);
						} else if (tmpindex !== -1)
							self.opt.checked.splice(tmpindex, 1);
					}

					var response = null;

					if (self.opt.checked) {
						response = self.opt.checked.slice(0);
					} else {
						response = [];
						for (var i = 0; i < self.opt.items.length; i++) {
							var m = self.opt.items[i];
							if (m.selected)
								response.push(m);
						}
					}

					response.quicksort('selectedts');
					self.opt.callback(response, self.opt.element, false, e);
				} else
					self.opt.callback(item, self.opt.element, false, e);
			}

			is = true;

			if (!self.opt.checkbox) {
				self.hide(0);
				e.preventDefault();
				e.stopPropagation();
			}

		});

		self.event('keydown', 'input', function(e) {
			var o = false;
			switch (e.which) {
				case 8:
					skipclear = false;
					break;
				case 27:
					o = true;
					self.hide();
					break;
				case 13:
					o = true;
					var sel = self.find('li.current');
					if (!sel.hclass('ui-disabled'))
						sel.trigger('click');
					break;
				case 38: // up
					o = true;
					selectedindex--;
					if (selectedindex < 0)
						selectedindex = 0;
					self.move();
					break;
				case 40: // down
					o = true;
					selectedindex++;
					if (selectedindex >= resultscount)
						selectedindex = resultscount;
					self.move();
					break;
			}

			if (o) {
				skipmouseforce();
				e.preventDefault();
				e.stopPropagation();
			}

		});

		self.event('input', 'input', function() {
			issearch = true;
			setTimeout2(self.ID, self.search, 100, null, this.value);
		});

		var fn = function() {
			is && !skiphide && self.hide(1);
		};

		self.on('reflow + scroll + resize + resize2', fn);
		$(W).on('scroll', fn);
	};

	self.move = function() {

		var counter = 0;
		var scroller = container.parent();
		var li = container.find('li');
		var hli = 0;
		var was = false;
		var last = -1;
		var lastselected = 0;
		var plus = 0;

		for (var i = 0; i < li.length; i++) {

			var el = $(li[i]);

			if (el.hclass('hidden')) {
				el.rclass('current');
				continue;
			}

			var is = selectedindex === counter;
			el.tclass('current', is);

			if (is) {
				hli = (el.innerHeight() || 30) + 1;
				plus = (hli * 2);
				was = true;
				var t = (hli * (counter || 1));
				scroller[0].scrollTop = t - plus;
			}

			counter++;
			last = i;
			lastselected++;
		}

		if (!was && last >= 0) {
			selectedindex = lastselected;
			li.eq(last).aclass('current');
		}
	};

	var nosearch = function() {
		issearch = false;
	};

	self.nosearch = function() {
		setTimeout2(self.ID + 'nosearch', nosearch, 500);
	};

	self.search = function(value) {

		if (!self.opt)
			return;

		icon.tclass('ti-times', !!value).tclass('ti-search', !value);

		if (self.opt.custom) {
			plus.tclass('hidden', !value);
			customvalue.innerHTML = (typeof(self.opt.custom) === 'string' ? self.opt.custom : config.create) + ': <b>' + (value ? Thelpers.encode(value.toString()) : '...') + '</b>';
		}

		if (!value && !self.opt.ajax) {
			if (!skipclear)
				container.find('li').rclass('hidden');
			if (!skipreset)
				selectedindex = 0;
			resultscount = self.opt.items ? self.opt.items.length : 0;
			customvalue.classList.toggle('hidden', !value);
			self.move();
			self.nosearch();
			return;
		}

		resultscount = 0;
		selectedindex = 0;

		if (self.opt.ajax) {
			var val = value || '';
			if (self.ajaxold !== val) {
				self.ajaxold = val;
				setTimeout2(self.ID, function(val) {
					self.opt && self.opt.ajax(val, function(items) {
						var builder = [];
						var indexer = {};
						var item;
						var key = (self.opt.search == true ? self.opt.key : (self.opt.search || self.opt.key)) || 'name';

						for (var i = 0; i < items.length; i++) {

							item = items[i];

							if (self.opt.exclude && self.opt.exclude(item))
								continue;

							if (self.opt.checked)
								item.selected = self.opt.checked.indexOf(item.id) !== -1;

							indexer.index = i;
							indexer.search = item[key] ? item[key].replace(regstrip, '') : '';
							indexer.checkbox = self.opt.checkbox === true;
							resultscount++;

							builder.push(self.opt.ta(item, indexer));
						}

						if (self.opt.empty) {
							item = {};
							var tmp = self.opt.raw ? '<b>{0}</b>'.format(self.opt.empty) : self.opt.empty;
							item[self.opt.key || 'name'] = tmp;
							if (!self.opt.raw)
								item.template = '<b>{0}</b>'.format(self.opt.empty);
							indexer.index = -1;
							builder.unshift(self.opt.ta(item, indexer));
						}

						if (customvalue.parentNode)
							customvalue.parentNode.removeChild(customvalue);

						skipclear = true;
						self.opt.items = items;
						container.html(builder);

						if (self.opt.custom) {
							container.prepend(customvalue);
							customvalue.classList.toggle('hidden', !value);
						}

						self.move();
						self.nosearch();
					});
				}, 300, null, val);
			}
		} else if (value) {

			value = value.toSearch().split(' ');
			var arr = container.find('li');

			for (var i = 0; i < arr.length; i++) {
				var el = $(arr[i]);
				var val = el.attrd('search') || '';
				if (!val)
					continue;

				val = val.toSearch();
				var is = false;

				for (var j = 0; j < value.length; j++) {
					if (val.indexOf(value[j]) === -1) {
						is = true;
						break;
					}
				}

				el.tclass('hidden', is);

				if (!is)
					resultscount++;
			}

			customvalue.classList.toggle('hidden', !value);
			skipclear = true;
			self.move();
			self.nosearch();
		}
	};

	self.show = function(opt) {

		// opt.element
		// opt.items
		// opt.callback(value, el)
		// opt.offsetX     --> offsetX
		// opt.offsetY     --> offsetY
		// opt.offsetWidth --> plusWidth
		// opt.placeholder
		// opt.render
		// opt.custom
		// opt.minwidth
		// opt.maxwidth
		// opt.key
		// opt.exclude    --> function(item) must return Boolean
		// opt.search
		// opt.selected   --> only for String Array "opt.items"
		// opt.classname
		// opt.checkbox
		// opt.checked;

		if (opt.checked == true)
			opt.checked = [];

		var el = opt.element instanceof jQuery ? opt.element[0] : opt.element;

		if (opt.items == null)
			opt.items = EMPTYARRAY;

		self.tclass(cls + '-default', !opt.render);

		if (opt.classname) {
			main.aclass(opt.classname);
			parentclass = opt.classname;
		}

		if (opt.class) {
			main.aclass(opt.class);
			parentclass2 = opt.class;
		}

		if (!opt.minwidth)
			opt.minwidth = config.minwidth;

		if (is) {
			clearTimeout(timeout);
			if (self.target === el) {
				self.hide(1);
				return;
			}
		}

		self.initializing = true;
		self.target = el;
		opt.ajax = null;
		self.ajaxold = null;

		var element = opt.element ? $(opt.element) : null;
		var callback = opt.callback;
		var items = opt.items;
		var type = typeof(items);
		var item;

		if (type === 'string') {
			items = opt.items = GET(items);
			type = typeof(items);
		}

		if (type === 'function' && callback) {
			type = '';
			opt.ajax = items;
			items = null;
		}

		if (!items && !opt.ajax) {
			self.hide(0);
			return;
		}

		self.tclass(cls + '-search-hidden', opt.search === false);

		self.opt = opt;
		opt.class && main.aclass(opt.class);
		skiphide = true;

		input.val('');

		var builder = [];
		var selected = null;

		opt.ta = opt.key ? Tangular.compile((opt.raw ? templateraw : template).replace(/\{\{\sname/g, '{{ ' + opt.key)) : opt.raw ? self.templateraw : self.template;

		if (!opt.ajax) {
			var indexer = {};
			var key = (opt.search == true ? opt.key : (opt.search || opt.key)) || 'name';
			for (var i = 0; i < items.length; i++) {

				item = items[i];

				if (typeof(item) === 'string')
					item = { name: item, id: item, selected: item === opt.selected };

				if (opt.exclude && opt.exclude(item))
					continue;

				if (item.selected || opt.selected === item) {
					selected = i;
					skipreset = true;
					item.selected = true;
				} else
					item.selected = false;

				if (opt.checked && item.selected)
					opt.checked.push(item.id);

				var c = '';

				if (item.selected)
					c += (c ? ' ' : 'selected current');

				if (item.classname)
					c += (c ? ' ' : item.classname);

				if (item.disabled)
					c += (c ? ' ' : 'ui-disabled');

				indexer.classes = c;
				indexer.checkbox = opt.checkbox === true;
				indexer.index = i;
				indexer.search = item[key] ? item[key].replace(regstrip, '') : '';
				builder.push(opt.ta(item, indexer));
			}

			if (opt.empty) {
				item = {};
				var tmp = opt.raw ? '<b>{0}</b>'.format(opt.empty) : opt.empty;
				item[opt.key || 'name'] = tmp;
				if (!opt.raw)
					item.template = '<b>{0}</b>'.format(opt.empty);
				indexer.index = -1;
				builder.unshift(opt.ta(item, indexer));
			}
		}

		self.target = element ? element[0] : null;

		var w = element ? element.width() : config.minwidth;
		var offset = element ? element.offset() : EMPTYOBJECT;
		var width = w + (opt.offsetWidth || 0);

		if (opt.minwidth && width < opt.minwidth)
			width = opt.minwidth;
		else if (opt.maxwidth && width > opt.maxwidth)
			width = opt.maxwidth;

		ready = false;

		opt.ajaxold = null;
		plus.aclass('hidden');
		self.find('input').prop('placeholder', opt.placeholder || config.placeholder);
		var scroller = self.find(cls2 + '-container').css('width', width + 30);

		if (customvalue.parentNode)
			customvalue.parentNode.removeChild(customvalue);

		container.html(builder);

		if (opt.custom)
			container.prepend(customvalue);

		var options = { left: 0, top: 0, width: width };
		var height = opt.height || scroller.height();

		scroller.css('height', opt.height || '');

		if (opt.element) {
			switch (opt.align) {
				case 'center':
					options.left = Math.ceil((offset.left - width / 2) + (opt.element.innerWidth() / 2));
					break;
				case 'right':
					options.left = (offset.left - width) + opt.element.innerWidth();
					break;
				default:
					options.left = offset.left;
					break;
			}

			options.top = opt.position === 'bottom' ? ((offset.top - height) + element.height()) : offset.top;
		} else {
			options.top = opt.y;
			options.left = opt.x;
		}

		options.scope = M.scope ? M.scope() : '';

		if (opt.offsetX)
			options.left += opt.offsetX;

		if (opt.offsetY)
			options.top += opt.offsetY;

		var mw = width;
		var mh = scroller.height();

		if (options.left < 0)
			options.left = 10;
		else if ((mw + options.left) > WW)
			options.left = (WW - mw) - 10;

		mh += search.height();

		if ((mh + options.top) > WH)
			options.top = (WH - mh) - 10;

		if (options.top < 10)
			options.top = 10;

		main.css(options);

		!isMOBILE && setTimeout(function() {
			if (opt.search !== false)
				input.focus();
		}, 200);

		setTimeout(function() {
			self.initializing = false;
			skiphide = false;
			is = true;

			if (selected) {
				var h = container.find('li:first-child').innerHeight() + 1;
				var y = (container.find('li.selected').index() * h) - (h * 2);
				scroller[0].scrollTop = y < 0 ? 0 : y;
			} else
				scroller[0].scrollTop = 0;

			ready = true;
			self.rclass('invisible');

		}, 100);

		if (is) {
			self.search();
			return;
		}

		selectedindex = selected || 0;
		resultscount = items ? items.length : 0;
		skipclear = true;

		self.search();
		self.aclass('invisible');
		self.rclass('hidden');

		setTimeout(function() {
			if (self.opt && ((self.opt.x != null && self.opt.y != null) || (self.target && self.target.offsetParent)))
				main.aclass(cls + '-visible');
			else
				self.hide(1);
		}, 100);

		skipreset = false;
	};

	self.hide = function(sleep) {

		if (!is || self.initializing)
			return;

		clearTimeout(timeout);
		timeout = setTimeout(function() {

			self.rclass(cls + '-visible').aclass('hidden');

			if (parentclass) {
				main.rclass(parentclass);
				parentclass = null;
			}

			if (parentclass2) {
				main.rclass(parentclass2);
				parentclass2 = null;
			}

			if (self.opt) {
				self.opt.close && self.opt.close();
				self.opt = null;
			}

			is = false;

		}, sleep ? sleep : 100);
	};
});

COMPONENT('datepicker', 'today:Set today;clear:Clear;firstday:0', function(self, config, cls) {

	var cls2 = '.' + cls;
	var skip = false;
	var visible = false;
	var current;
	var elyears, elmonths, elbody;
	var main;

	self.days = EMPTYARRAY;
	self.days_short = EMPTYARRAY;
	self.months = EMPTYARRAY;
	self.months_short = EMPTYARRAY;
	self.years_from;
	self.years_to;

	self.singleton();
	self.readonly();
	self.nocompile();

	self.configure = function(key, value) {
		switch (key) {
			case 'days':

				if (value instanceof Array)
					self.days = value;
				else
					self.days = value.split(',').trim();

				self.days_short = [];

				for (var i = 0; i < DAYS.length; i++) {
					DAYS[i] = self.days[i];
					self.days_short[i] = DAYS[i].substring(0, 2).toUpperCase();
				}

				break;

			case 'months':
				if (value instanceof Array)
					self.months = value;
				else
					self.months = value.split(',').trim();

				self.months_short = [];

				for (var i = 0, length = self.months.length; i < length; i++) {
					var m = self.months[i];
					MONTHS[i] = m;
					if (m.length > 4)
						m = m.substring(0, 3) + '.';
					self.months_short.push(m);
				}
				break;

			case 'yearfrom':
				if (value.indexOf('current') !== -1)
					self.years_from = +(NOW.format('yyyy'));
				else
					self.years_from = +(NOW.add(value).format('yyyy'));
				break;

			case 'yearto':
				if (value.indexOf('current') !== -1)
					self.years_to = +(NOW.format('yyyy'));
				else
					self.years_to = +(NOW.add(value).format('yyyy'));
				break;
		}
	};

	function getMonthDays(dt) {

		var m = dt.getMonth();
		var y = dt.getFullYear();

		if (m === -1) {
			m = 11;
			y--;
		}

		return (32 - new Date(y, m, 32).getDate());
	}

	self.calculate = function(year, month, selected) {

		var d = new Date(year, month, 1, 12, 0);
		var output = { header: [], days: [], month: month, year: year };
		var firstday = config.firstday;
		var firstcount = 0;
		var frm = d.getDay() - firstday;
		var today = NOW;
		var ty = today.getFullYear();
		var tm = today.getMonth();
		var td = today.getDate();
		var sy = selected ? selected.getFullYear() : -1;
		var sm = selected ? selected.getMonth() : -1;
		var sd = selected ? selected.getDate() : -1;
		var days = getMonthDays(d);

		if (frm < 0)
			frm = 7 + frm;

		while (firstcount++ < 7) {
			output.header.push({ index: firstday, name: self.days_short[firstday] });
			firstday++;
			if (firstday > 6)
				firstday = 0;
		}

		var index = 0;
		var indexEmpty = 0;
		var count = 0;
		var prev = getMonthDays(new Date(year, month - 1, 1, 12, 0)) - frm;
		var cur;

		for (var i = 0; i < days + frm; i++) {

			var obj = { today: false, selected: false, empty: false, future: false, number: 0, index: ++count };

			if (i >= frm) {
				obj.number = ++index;
				obj.selected = sy === year && sm === month && sd === index;
				obj.today = ty === year && tm === month && td === index;
				obj.future = ty < year;
				if (!obj.future && year === ty) {
					if (tm < month)
						obj.future = true;
					else if (tm === month)
						obj.future = td < index;
				}

			} else {
				indexEmpty++;
				obj.number = prev + indexEmpty;
				obj.empty = true;
				cur = d.add('-' + indexEmpty + ' days');
			}

			if (!obj.empty)
				cur = d.add(i + ' days');

			obj.month = i >= frm && obj.number <= days ? d.getMonth() : cur.getMonth();
			obj.year = i >= frm && obj.number <= days ? d.getFullYear() : cur.getFullYear();
			obj.date = cur;
			output.days.push(obj);
		}

		indexEmpty = 0;

		for (var i = count; i < 42; i++) {
			var cur = d.add(i + ' days');
			var obj = { today: false, selected: false, empty: true, future: true, number: ++indexEmpty, index: ++count };
			obj.month = cur.getMonth();
			obj.year = cur.getFullYear();
			obj.date = cur;
			output.days.push(obj);
		}

		return output;
	};

	self.hide = function() {
		if (visible) {
			self.unbindevents();
			self.opt.close && self.opt.close();
			self.opt = null;
			self.older = null;
			self.target = null;
			self.aclass('hidden');
			self.rclass(cls + '-visible');
			visible = false;
		}
		return self;
	};

	self.show = function(opt) {

		setTimeout(function() {
			clearTimeout2('datepickerhide');
		}, 5);

		var el = $(opt.element);
		var dom = el[0];

		if (self.target === dom) {
			self.hide();
			return;
		}

		if (self.opt && self.opt.close)
			self.opt.close();

		var off = el.offset();
		var w = el.innerWidth();
		var h = el.innerHeight();
		var l = 0;
		var t = 0;
		var height = 305 + (opt.cancel ? 25 : 0);
		var s = 250;

		if (opt.element) {
			switch (opt.align) {
				case 'center':
					l = Math.ceil((off.left - s / 2) + (w / 2));
					break;
				case 'right':
					l = (off.left + w) - s;
					break;
				default:
					l = off.left;
					break;
			}

			t = opt.position === 'bottom' ? (off.top - height) : (off.top + h + 12);
		}

		if (opt.offsetX)
			l += opt.offsetX;

		if (opt.offsetY)
			t += opt.offsetY;

		if ((l + s) > WW)
			l = (l + w) - s;

		if ((t + height) > WH)
			t = WH - height - 10;

		var restrict = true;
		var parent = dom.parentNode;

		while (parent) {
			if (parent.tagName === 'BODY') {
				restrict = false;
				break;
			}
			if (parent.classList.contains('ui-scrollbar-area'))
				break;
			parent = parent.parentNode;
		}

		if (restrict && (t + height) > WH)
			t = (t + h) - height;

		var dt = typeof(opt.value) === 'string' ? GET(opt.value) : opt.value;
		if ((!(dt instanceof Date)) || isNaN(dt.getTime()))
			dt = NOW;

		opt.scope = M.scope ? M.scope() : '';
		self.opt = opt;
		self.time = dt.format('HH:mm:ss');
		self.rclass('hidden');
		self.date(dt);
		main.css({ left: l, top: t });
		main.aclass(cls + '-visible', 50);
		self.bindevents();
		self.target = dom;
		visible = true;
	};

	self.setdate = function(dt) {

		if (!dt) {
			if (typeof(self.opt.value) === 'string')
				SET(self.opt.value + ' @change', dt);
			else
				self.opt.callback(dt);
			return;
		}

		var time = self.time.split(':');

		if (time.length > 1) {
			dt.setHours(+(time[0] || '0'));
			dt.setMinutes(+(time[1] || '0'));
			dt.setSeconds(+(time[2] || '0'));
		}

		self.opt.scope && M.scope(self.opt.scope);

		if (typeof(self.opt.value) === 'string')
			SET(self.opt.value + ' @change', dt);
		else
			self.opt.callback(dt);
	};

	self.make = function() {

		self.aclass(cls + '-container hidden');

		var conf = {};
		var reconfigure = false;

		if (!config.days) {
			conf.days = [];
			for (var i = 0; i < DAYS.length; i++)
				conf.days.push(DAYS[i]);
			reconfigure = true;
		}

		if (!config.months) {
			conf.months = MONTHS;
			reconfigure = true;
		}

		reconfigure && self.reconfigure(conf);
		W.$datepicker = self;

		self.event('click', function(e) {
			e.stopPropagation();
		});

		var hide = function() {
			visible && W.$datepicker && W.$datepicker.hide();
		};

		var hide2 = function() {
			visible && setTimeout2('datepickerhide', function() {
				W.$datepicker && W.$datepicker.hide();
			}, 20);
		};

		self.bindevents = function() {
			if (!visible)
				$(W).on('scroll', hide2);
		};

		self.unbindevents = function() {
			if (visible)
				$(W).off('scroll', hide2);
		};

		self.element.on('click', function(e) {
			if (e.target === self.dom)
				hide();
		});

		self.on('reflow + scroll + resize + resize2', hide);
	};

	self.makehtml = function() {
		var builder = [];
		builder.push('<div class="{0}-header"><span class="{0}-next"><i class="ti ti-angle-right"></i></span><span class="{0}-prev"><i class="ti ti-angle-left"></i></span><div class="{0}-info"><span class="{0}-month">---</span><span class="{0}-year">---</span></div></div><div class="{0}-years hidden"></div><div class="{0}-months"></div><div class="{0}-body hidden"><div class="{0}-week">'.format(cls));
		for (var i = 0; i < 7; i++)
			builder.push('<div></div>');
		builder.push('</div><div class="{0}-days">'.format(cls));

		var clearbtn = self.opt.clear === false ? null : '<span>{1}</span>'.format(cls, config.clear);

		for (var i = 0; i < 42; i++)
			builder.push('<div class="{0}-date"><div></div></div>'.format(cls, i));
		builder.push('</div></div><div class="{0}-footer"><span class="{0}-now">{2}</span><span class="{0}-clear">{3}</span></div>'.format(cls, config.close, config.today, clearbtn));

		self.html('<div class="{0}">{1}</div>'.format(cls, builder.join('')));
		main = $(self.find(cls2)[0]);

		builder = [];
		elbody = self.find(cls2 + '-body');
		elmonths = self.find(cls2 + '-months');
		for (var i = 0; i < 12; i++)
			builder.push('<div class="{0}-month" data-index="{1}"><div></div></div>'.format(cls, i));
		elmonths.html(builder.join(''));

		builder = [];
		elyears = self.find(cls2 + '-years');
		for (var i = 0; i < 25; i++)
			builder.push('<div class="{0}-year"><div></div></div>'.format(cls));
		elyears.html(builder.join(''));

		self.makehtml = null;

		self.find(cls2 + '-month').on('click', function(e) {

			var el = $(this);
			var index = el.attrd('index');
			var h = 'hidden';

			if (index) {
				current.setMonth(+index);
				self.date(current, true);
			} else if (!elmonths.hclass(h))
				index = 1;

			elyears.aclass(h);

			if (index)
				elmonths.aclass(h);
			else {
				elmonths.find(cls2 + '-today').rclass(cls + '-today');
				elmonths.find(cls2 + '-month').eq(current.getMonth()).aclass(cls + '-today');
				elmonths.rclass(h);
			}

			elbody.tclass(h, !elmonths.hclass(h));
			e.preventDefault();
			e.stopPropagation();

		});

		self.find(cls2 + '-year').on('click', function(e) {
			var el = $(this);
			var year = el.attrd('year');
			var h = 'hidden';

			if (year) {
				current.setFullYear(+year);
				self.date(current, true);
			} else if (!elyears.hclass(h))
				year = 1;

			elmonths.aclass(h);

			if (year)
				elyears.aclass(h);
			else {
				self.years();
				elyears.rclass(h);
			}

			elbody.tclass(h, !elyears.hclass(h));
			e.preventDefault();
			e.stopPropagation();
		});

		self.years = function() {
			var dom = self.find(cls2 + '-years').find(cls2 + '-year');
			var year = current.getFullYear();
			var index = 12;
			for (var i = 0; i < 25; i++) {
				var val = year - (index--);
				$(dom[i]).tclass(cls + '-today', val === year).attrd('year', val).find('div')[0].innerHTML = val;
			}
		};

		self.find(cls2 + '-date').on('click', function() {
			var dt = $(this).attrd('date').split('-');
			self.setdate(new Date(+dt[0], +dt[1], +dt[2], 12, 0, 0));
			self.hide();
		});

		self.find(cls2 + '-now').on('click', function() {
			self.setdate(new Date());
			self.hide();
		});

		self.find(cls2 + '-clear').on('click', function() {
			self.setdate(null);
			self.hide();
		});

		self.find(cls2 + '-next').on('click', function(e) {

			if (elyears.hclass('hidden')) {
				current.setMonth(current.getMonth() + 1);
				self.date(current, true);
			} else {
				current.setFullYear(current.getFullYear() + 25);
				self.years();
			}

			e.preventDefault();
			e.stopPropagation();
		});

		self.find(cls2 + '-prev').on('click', function(e) {

			if (elyears.hclass('hidden')) {
				current.setMonth(current.getMonth() - 1);
				self.date(current, true);
			} else {
				current.setFullYear(current.getFullYear() - 25);
				self.years();
			}

			e.preventDefault();
			e.stopPropagation();
		});
	};

	self.date = function(value, skipday) {

		var clssel = cls + '-selected';

		self.makehtml && self.makehtml();

		if (typeof(value) === 'string')
			value = value.parseDate();

		var year = value == null ? null : value.getFullYear();
		if (year && (year < self.years_from || year > self.years_to))
			return;

		if (!value || isNaN(value.getTime())) {
			self.find('.' + clssel).rclass(clssel);
			value = NOW;
		}

		var empty = !value;

		if (skipday) {
			skipday = false;
			empty = true;
		}

		if (skip) {
			skip = false;
			return;
		}

		value = new Date((value || NOW).getTime());

		var output = self.calculate(value.getFullYear(), value.getMonth(), value);
		var dom = self.find(cls2 + '-date');

		self.find(cls2 + '-body').rclass('hidden');
		self.find(cls2 + '-months,' + cls2 + '-years').aclass('hidden');

		current = value;

		for (var i = 0; i < 42; i++) {

			var item = output.days[i];
			var classes = [cls + '-date'];

			if (item.empty)
				classes.push(cls + '-disabled');

			if (!empty && item.selected)
				classes.push(cls + '-selected');

			if (item.today)
				classes.push(cls + '-day-today');

			var el = $(dom[i]);
			el.attrd('date', item.year + '-' + item.month + '-' + item.number);
			el.find('div').html(item.number);
			el.find('i').remove();
			el.rclass().aclass(classes.join(' '));
		}

		if (!skipday) {

			dom = self.find(cls2 + '-week').find('div');
			for (var i = 0; i < 7; i++)
				dom[i].innerHTML = output.header[i].name;

			dom = self.find(cls2 + '-months').find(cls2 + '-month');
			for (var i = 0; i < 12; i++)
				$(dom[i]).find('div').attrd('index', i)[0].innerHTML = self.months_short[i];
		}

		self.opt.badges && self.opt.badges(current, function(date) {

			if (!(date instanceof Array))
				date = [date];

			for (var i = 0; i < date.length; i++) {
				var dt = date[i].getFullYear() + '-' + date[i].getMonth() + '-' + date[i].getDate();
				var el = self.find(cls2 + '-date[data-date="{0}"]'.format(dt));
				if (el.length && !el.find('i').length)
					el.append('<i class="ti ti-circle-alt"></i>');
			}

		});

		var info = self.find(cls2 + '-info');
		info.find(cls2 + '-month').html(self.months[current.getMonth()]);
		info.find(cls2 + '-year').html(current.getFullYear());

	};
});

COMPONENT('timepicker', function(self, config, cls) {

	var cls2 = '.' + cls;
	var bindedevents = false;
	var timeout = 0;
	var is;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		self.aclass(cls + ' hidden');
		self.append('<div class="{0}-hours"><i class="ti ti-chevron-up"></i><input type="text" maxlength="2" /><i class="ti ti-chevron-down"></i></div><div class="{0}-minutes"><i class="ti ti-chevron-up"></i><input type="text" maxlength="2" /><i class="ti ti-chevron-down"></i></div><div class="{0}-seconds hidden"><i class="ti ti-chevron-up"></i><input type="text" maxlength="2" /><i class="ti ti-chevron-down"></i></div><div class="{0}-ampm hidden"><i class="ti ti-chevron-up"></i><span>AM</span><i class="ti ti-chevron-down"></i></div>'.format(cls));

		var fn = function(e) {
			if (is && (e.type !== 'keydown' || e.which === 27))
				self.hide(1);
		};

		self.on('reflow', fn);
		self.on('scroll', fn);
		self.on('resize', fn);

		self.event('keydown', 'input', function(e) {
			var code = e.which;

			if (code === 38 || code === 40) {
				e.preventDefault();
				$(this).parent().find('.ti-chevron-' + (code === 38 ? 'up' : 'down')).trigger('click');
				return;
			}

			if (code === 13 || code === 27) {
				self.hide(1);
				return;
			}

			if ((code === 9 || code === 8 || code === 37 || code === 39 || code === 27 || (code > 47 && code < 58))) {
				if (code > 47 || code === 8)
					self.update();
			} else
				e.preventDefault();
		});

		self.event('click', 'i', function() {

			var el = $(this);
			var parent = el.parent();
			var cls = parent.attr('class');
			var up = el.hclass('ti-chevron-up');
			var type = cls.substring(cls.lastIndexOf('-') + 1);
			var val;

			switch (type) {
				case 'hours':
				case 'minutes':
				case 'seconds':
					var input = parent.find('input');
					val = +input.val();

					if (up)
						val++;
					else
						val--;

					if (val < 0) {
						if (type === 'hours')
							val = self.opt.ampm ? 12 : 23;
						else
							val = 59;
					} else {
						if (type === 'hours') {
							if (self.opt.ampm) {
								if (val > 12)
									val = 0;
							} else if (val > 23)
								val = 0;
						} else {
							if (val > 59)
								val = 0;
						}
					}

					val = val.toString();
					input.val(self.opt.ampm ? val : (val.length > 1 ? val : ('0' + val)));
					break;
				case 'ampm':
					var span = self.find('span');
					val = span.text().toLowerCase();
					if (val === 'am')
						val = 'PM';
					else
						val = 'AM';
					span.html(val);
					break;
			}

			self.update();
		});

		self.update = function() {
			setTimeout2(self.ID, function() {

				var current = self.opt.current;
				var h = +(self.find(cls2 + '-hours input').val() || '0');
				var m = +(self.find(cls2 + '-minutes input').val() || '0');
				var s = +(self.find(cls2 + '-seconds input').val() || '0');
				var ampm = +self.find(cls2 + '-ampm span').html().toLowerCase();

				if (!self.opt.seconds)
					s = 0;

				if (ampm === 'pm')
					h += 12;

				current.setHours(h);
				current.setMinutes(m);
				current.setSeconds(s);

				if (self.opt.callback)
					self.opt.callback(current);
				else if (self.opt.path)
					SET(self.opt.path, current);

			}, 500);
		};

		self.event('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
		});

		self.bindevents = function() {
			if (!bindedevents) {
				bindedevents = true;
				$(document).on('click', fn);
				$(W).on('scroll', fn).on('keydown', fn);
			}
		};

		self.unbindevents = function() {
			if (bindedevents) {
				bindedevents = false;
				$(document).off('click', fn);
				$(W).off('scroll', fn).off('keydown', fn);
			}
		};
	};

	self.show = self.toggle = function(opt) {

		var el = opt.element;
		if (el instanceof jQuery)
			el = el[0];

		if (self.target === el) {
			self.hide(0);
			return;
		}

		var value = opt.value || opt.date || opt.time || NOW;

		if (typeof(value) === 'string') {
			opt.path = value;
			value = GET(value);
		}

		var count = 0;

		if (opt.ampm == null)
			opt.ampm = !!config.ampm;

		if (opt.seconds == null)
			opt.seconds = !!config.seconds;

		self.find(cls2 + '-seconds').tclass('hidden', !opt.seconds);
		self.find(cls2 + '-ampm').tclass('hidden', !opt.ampm);

		if (opt.seconds)
			count++;

		if (opt.ampm)
			count++;

		var ampm = opt.ampm;

		self.find(cls2 + '-hours input').val(value.format(ampm ? '!H' : 'HH'));
		self.find(cls2 + '-minutes input').val(value.format(ampm ? 'm' : 'mm'));
		self.find(cls2 + '-seconds input').val(value.format(ampm ? 's' : 'ss'));
		self.find(cls2 + '-ampm span').html(value.format('a').toUpperCase());

		opt.current = value;
		self.target = el;
		self.opt = opt;
		self.bindevents();

		el = $(el);
		var off = el.offset();

		if (opt.offsetX)
			off.left += opt.offsetX;

		if (opt.offsetY)
			off.top += opt.offsetY;

		off.top += el.innerHeight() + 12;
		self.element.css(off);
		self.rclass2(cls + '-').tclass(cls + '-' + count).rclass('hidden').aclass(cls + '-visible', 100);
		clearTimeout(timeout);

		setTimeout(function() {
			is = true;
		}, 500);
	};

	self.hide = function(sleep) {

		if (!is) {
			self.target = null;
			return;
		}

		clearTimeout(timeout);
		timeout = setTimeout(function() {

			self.unbindevents();

			if (self.opt) {
				self.opt.close && self.opt.close();
				self.opt.close = null;
			}

			self.rclass(cls + '-visible').aclass('hidden');
			self.target = null;
			is = false;
		}, sleep ? sleep : 100);
	};

});

COMPONENT('panel', 'width:350;icon:home;zindex:12;scrollbar:true;scrollbarY:true;margin:0;padding:20;closeicon:ti ti-times', function(self, config, cls) {

	var cls2 = '.' + cls;

	if (!W.$$panel) {

		W.$$panel_level = W.$$panel_level || 1;
		W.$$panel = true;

		$(document).on('click touchend', cls2 + '-button-close,' + cls2 + '-container', function(e) {
			var target = $(e.target);
			var curr = $(this);
			var main = target.hclass(cls + '-container');
			if (curr.hclass(cls + '-button-close') || main) {
				var parent = target.closest(cls2 + '-container');
				var com = parent.component();
				if (!main || com.config.bgclose) {

					if (com.config.close)
						com.EXEC(com.config.close, com);
					else
						com.hide();

					e.preventDefault();
					e.stopPropagation();
				}
			}
		});

		var resize = function() {
			SETTER('panel/resize');
		};

		ON('resize + resize2', function() {
			setTimeout2('panelresize', resize, 100);
		});
	}

	self.icon = function(value, path, el) {
		el.rclass().aclass(cls + '-icon ' + self.faicon(value.icon));
	};

	self.readonly();

	self.esc = function(bind) {
		if (bind) {
			if (!self.$esc) {
				self.$esc = true;
				$(W).on('keydown', self.esc_keydown);
			}
		} else {
			if (self.$esc) {
				self.$esc = false;
				$(W).off('keydown', self.esc_keydown);
			}
		}
	};

	self.esc_keydown = function(e) {
		if (e.which === 27 && !e.isPropagationStopped()) {
			var val = self.get();
			if (!val || config.if === val) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			}
		}
	};

	self.hide = function() {
		self.set('');
	};

	self.resize = function() {
		var el = self.element.find(cls2 + '-body');
		var h = WH - self.find(cls2 + '-header').height() - (config.padding * 2);
		el.height(h);
		self.find(cls2).css('max-width', isMOBILE ? WW - 40 : '');
		config.container && el.find(config.container).height(h - config.margin);
		self.scrollbar && self.scrollbar.resize();
	};

	self.make = function() {

		var scr = self.find('> script');
		self.template = scr.length ? scr.html() : '';
		$(document.body).append('<div id="{0}" class="hidden {5}-container{3}"><div class="{5}" style="max-width:{1}px"><div data-bind="@config__change .ui-panel-icon:@icon__html span:value.title" class="{5}-title"><button name="cancel" class="{5}-button-close{2}"><i class="{6}"></i></button><button name="menu" class="{5}-button-menu{4}"><i class="ti ti-ellipsis-h"></i></button><i class="{5}-icon"></i><span></span></div><div class="{5}-header"></div><div class="{5}-body"></div></div>'.format(self.ID, config.width, config.closebutton == false ? ' hidden' : '', config.bg ? '' : ' ui-panel-inline', config.menu ? '' : ' hidden', cls, config.closeicon));
		var el = $('#' + self.ID);
		var body = el.find(cls2 + '-body');

		while (self.dom.children.length)
			body[0].appendChild(self.dom.children[0]);

		self.rclass('hidden');
		self.replace(el, true);

		if (config.scrollbar && W.SCROLLBAR) {
			if (config.container)
				body = body.find(config.container);
			self.scrollbar = SCROLLBAR(body, { shadow: config.scrollbarshadow, visibleY: !!config.scrollbarY, orientation: 'y' });
			self.scrollleft = self.scrollbar.scrollLeft;
			self.scrolltop = self.scrollbar.scrollTop;
			self.scrollright = self.scrollbar.scrollRight;
			self.scrollbottom = self.scrollbar.scrollBottom;
		} else
			body.aclass(cls + '-scroll');

		self.event('click', 'button[name],.cancel', function() {
			switch (this.name) {
				case 'menu':
					self.EXEC(config.menu, $(this), self);
					break;
				case 'cancel':
					self.hide();
					break;
				default:
					if ($(this).hclass('cancel'))
						self.hide();
					break;
			}
		});

		self.resize();
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'bg':
				self.tclass(cls + '-inline', !value);
				self.element.css('max-width', value ? 'inherit' : (config.width + 1));
				break;
			case 'closebutton':
				!init && self.find(cls2 + '-button-close').tclass(value !== true);
				break;
			case 'width':
				self.element.css('max-width', config.bg ? 'inherit' : value);
				self.find(cls2 + '').css('max-width', value);
				break;
		}
	};

	self.setter = function(value) {

		setTimeout2(cls + '-noscroll', function() {
			$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
		}, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && self.EXEC(config.reload, self);
				config.default && DEFAULT(self.makepath(config.default), true);
			}
			return;
		}

		setTimeout2('panelreflow', function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			self.aclass('hidden');
			self.release(true);
			self.esc(false);
			self.rclass(cls + '-animate');
			W.$$panel_level--;
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find('div[data-jc-replaced]').html(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$panel_level < 1)
			W.$$panel_level = 1;

		W.$$panel_level++;

		var container = self.element.find(cls2 + '-body');
		self.css('z-index', W.$$panel_level * config.zindex);
		container.scrollTop(0);
		self.rclass('hidden');
		self.release(false);
		setTimeout(self.resize, 100);

		config.reload && self.EXEC(config.reload, self);
		config.refresh && self.EXEC(config.refresh, self);
		config.default && DEFAULT(self.makepath(config.default), true);

		setTimeout(function() {
			if (self.scrollbar)
				self.scrollbar.scroll(0, 0);
			else
				container.scrollTop(0);
			self.aclass(cls + '-animate');
			config.autofocus && self.autofocus(config.autofocus);
		}, 300);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.id, function() {
			self.css('z-index', (W.$$panel_level * config.zindex) + 1);
		}, 1000);

		config.closeesc && self.esc(true);
	};
});