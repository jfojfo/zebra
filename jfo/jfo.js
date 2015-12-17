zebra()['zebra.json'] = ('/zebra.json');

// load with callback will call zebra.busy();
// our run function will get called after json config loaded
new zebra.ui.Bag(zebra('jfo')).load('jfo.json', function(){});

zebra.ready(run);

function test() {
    eval(zebra.Import("ui", "layout"));

    var arr = [];
    for (var i = 0; i < 90; ++i) {
        var label = new Label(new zebra.data.Text('test' + i)).properties({
            color: "red",
            border: new Border("cyan"),
            font: new Font("Verdana", 14)
        });
        var fl = new Panel(new FlowLayout(LEFT, CENTER, HORIZONTAL, 4));
        fl.layout.stretchLast = true;
        fl.add(label);
        arr.push(fl);
    }

    var MyListLayout = zebra.Class(zebra.layout.ListLayout, [
        function calcPreferredSize(lw) {
            var ps = this.$super(lw);
            return {
                width: root.width - root.left - root.right - this.gap,
                height: ps.height
            };
        },
        function getPreferredSize() {
            return this.$super();
        },
        function doLayout(t) {
            this.$super(t);
        }
    ]);

    var innerPan = new Panel({
        layout: new MyListLayout(4),
        border: new Border("green"),
//        psWidth: 220,
        kids: arr
    });


    var sp = new ScrollPan(innerPan, 'vertical', true);

    var z = new zCanvas('mycanvas');
    z.fullScreen();
    var root = z.root.properties({
        layout: new BorderLayout(10),
        padding: 8,
        border: new Border("red"),
        kids: {
            CENTER: sp
        }
    });
}

function test2() {
    eval(zebra.Import("ui", "layout"));

    var z = new zCanvas('mycanvas');
    z.fullScreen();
    var root = z.root;
    root.setPadding(8);
    root.setBorder("plain");
    root.setBackground("#EEEEEE");
    root.setLayout(new BorderLayout(4,4));
    root.add(LEFT, new HtmlTextArea("HTML text area").properties({
        attributes: {
//            'readonly': 1
        }
    }));
    root.add(TOP, new HtmlTextField("HTML input field"));
    root.add(CENTER, new TextArea("Zebra text area"));
    root.add(BOTTOM, new Button("Test"));
}

function run() {
    eval(zebra.Import("ui", "layout"));

    var z = new zCanvas('mycanvas');
    z.fullScreen();

//    function F(){}
//    F.prototype = zebra.ui.Font.prototype;
//    function MyFont(name, style, size){
//        zebra.ui.Font.apply(this, arguments);
//    }
//    MyFont.prototype = new F();
//    MyFont.prototype.constructor = MyFont;
//    MyFont.prototype.stringWidth = function (s) {
//        return zebra.ui.Font.prototype.stringWidth.call(this, s);
//    }

    var WrapText = zebra.Class(zebra.data.Text, [
        function (text, font, maxWidth) {
            this.origText = text;
            this.font = font ? font : null;
            this.maxWidth = maxWidth ? maxWidth : 0;
            return this.$super(text);
        },
        function setValue(text) {
            if (this.maxWidth > 0 && this.font != null) {
                var lines = [];
                var s = '';
                for (var i in text) {
                    var c = text[i];
                    var old = s;
                    s += c;

                    if (c == '\n') {
                        lines.push(old);
                        s = '';
                    } else {
                        var width = this.font.stringWidth(s);
                        if (width > this.maxWidth) {
                            if (old.length == 0) {
                                old = s;
                            }
                            lines.push(old);
                            s = c;
                        }
                    }
                }
                lines.push(s);
                text = lines.join('\n');
            }
            return this.$super(text);
        },
        function setFont(font) {
            if (this.font != font) {
                this.font = font;
                this.setValue(this.origText);
            }
        },
        function setMaxWidth(maxWidth) {
            if (this.maxWidth != maxWidth) {
                this.maxWidth = maxWidth;
                this.setValue(this.origText);
            }
        }
    ]);

    var WrapLabel = zebra.Class(Label, [
        function setModel(m) {
            var render = m;
            if (zebra.isString(m)) {
                var text = new WrapText(m);
                var render = new TextRender(text);
                text.setFont(render.font);
            } else if (zebra.instanceOf(m, zebra.data.TextModel)) {
                render = new TextRender(m);
            }
            this.setView(render);
        },
        function setFont(f) {
            var model = this.getModel();
            if (model != null) {
                model.setFont(f);
            }
            return this.$super(f);
        },
        function resized(prevWidth, prevHeight) {
            var model = this.getModel();
            if (model != null) {
                // this will invalidate all
                model.setMaxWidth(this.width);
            }
            this.$super(prevWidth, prevHeight);
        }
    ]);

    var DebugPanel = zebra.Class(Panel, [
        function calcPreferredSize(target) {
            return this.$super(target);
        },
        function getPreferredSize() {
            return this.$super();
        },

        function childPointerEntered(e) {
            if (e.identifier === 'mouse') {
                this.origBackground = e.source.bg;
                e.source.setBackground("orange");
            }
        },
        function childPointerExited(e) {
            if (e.identifier === 'mouse') {
                e.source.setBackground(this.origBackground);
            }
        }
    ]);

    var SlideButton = zebra.Class(Panel, [
        function() {
            this.$super(new RasterLayout(USE_PS_SIZE));
            this.duration = 150.0;
            this.startTime = -1;
            this.isOn = false;
            this.track = new StatePan({
                id: 'trackPan',
                scale: 0.65,
                view: {
                    'on': new CompRender(new ImagePan('img/icon_toggle_on.png').properties({
                        id: 'trackOn'
                    })),
                    '*': new CompRender(new ImagePan('img/icon_toggle_off.png').properties({
                        id: 'trackOff'
                    }))
                }
            });
            this.thumb = new ImagePan('img/icon_toggle_thumb.png').properties({
                id: 'thumb',
                top: 3,
                scale: 0.65
            });
            this.add(LEFT | CENTER, this.track);
            this.add(LEFT | CENTER, this.thumb);
        },
        function recalc() {
            this.track.view.recalc();
        },
        function childPointerPressed(e) {
            if (e.source.id === 'thumb' || e.source.id === 'trackPan') {
                if (this.startTime < 0) {
                    this.toggle();
                }
            }
        },
        function toggle() {
            if (this.startTime >= 0) {
                return;
            }

            this.isOn = !this.isOn;
            this.track.setState(this.isOn ? 'on' : 'off');
            if (this.onToggle) {
                this.onToggle(this.isOn);
            }

            this.startTime = 0;
            zebra.web.$task(function anim() {
                if (this.startTime == 0) {
                    this.startTime = performance.now();
                }
                var time = performance.now();
                var delta = time - this.startTime;

                var distance = this.track.width - this.thumb.width;
                var dx = distance * delta / this.duration;
                dx = dx > distance ? distance : dx;
                this.thumb.setLocation(
                    this.isOn ? dx : distance - dx,
                    this.thumb.y
                );

                this.repaint();
                if (delta > this.duration) {
                    this.startTime = -1;
                } else {
                    zebra.web.$task(anim.bind(this));
                }
            }.bind(this));
        }
    ]);


    var IMAGE_SIZE = 40;
    var font = 'Microsoft YaHei, Heiti SC';

    var titleBar = new Panel({
        id: 'titleBar',
        layout: new BorderLayout(),
        background: 'white',
        psHeight: 60,
        kids: {
            LEFT: new Panel({
                id: 'titleBar_LeftPanel',
                layout: new RasterLayout(USE_PS_SIZE),
                kids: {
                    CENTER: new EvStatePan({
                        id: 'left',
                        view: {
                            'pressed.over': new CompRender(new ImagePan("img/back_p.png", IMAGE_SIZE, IMAGE_SIZE)),
                            '*': new CompRender(new ImagePan("img/back.png", IMAGE_SIZE, IMAGE_SIZE).properties({
                                id: 'backimg'
                            }))
                        }
                    }, [
                        function pointerClicked(e) {
                            console.log('================> left clicked');
                        }
                    ])
                }
            }),
            CENTER: new Panel({
                id: 'titleBar_CenterPanel',
                layout: new RasterLayout(USE_PS_SIZE),
                kids: {
                    CENTER: new Label(new Label("到站加油")).properties({
                        id: 'titleText',
                        font: new Font(font, 22)
                    })
                }
            }),
            RIGHT: new Panel({
                id: 'titleBar_RightPanel',
                layout: new RasterLayout(USE_PS_SIZE),
                kids: {
                    CENTER: new EvStatePan({
                        id: 'right',
                        view: {
                            'pressed.over': new CompRender(new ImagePan("img/order_person_press.png", IMAGE_SIZE, IMAGE_SIZE)),
                            '*': new CompRender(new ImagePan("img/order_person.png", IMAGE_SIZE, IMAGE_SIZE))
                        }
                    }, [
                        function pointerClicked(e) {
                            console.log('================> right clicked');
                        }
                    ])
                }
            })
        }
    });
//    titleBar.find('#backimg').imageLoaded = function () {
//        // titleBar.repaint();
//        console.log('backimg loaded');
//    };

    var gasStation = new Panel({
        id: 'station',
        layout: new BorderLayout(6),
        padding: 10,
        background: 'white',
        kids: {
            CENTER: new Panel({
                id: 'station_LeftPanel',
                layout: new ListLayout(6),
                kids: [
                    new AutoWrapLabel("壳牌园西路加油站（农大加油站）东路口西路").properties({
                        id: 'stationName',
                        color: "black",
                        font: new Font(font, 16)
                    }),
                    new Label("北京市海淀区圆明园西路28").properties({
                        id: 'stationAddr',
                        font: new Font(font, 12)
                    }),
                    new Label("每天22:00至次日06:00，92#汽油，优惠0.4元").properties({
                        id: 'stationDiscount',
                        color: "red",
                        font: new Font(font, 12)
                    })
                ]
            }),
            RIGHT: new Panel({
                id: 'station_RightPanel',
                layout: new RasterLayout(USE_PS_SIZE),
                kids: {
                    CENTER: new Button('切换油站', [
                        function pointerClicked(e) {
                            console.log('================> change clicked');
                        }
                    ]).properties({
                        id: 'change',
                        canHaveFocus: false
                    })
                }
            })
        }
    }, [
        function catchInput(target) {
            if (target.id === 'change') {
                return false;
            }
            return true;
        },
        function pointerClicked(e) {
            console.log('================> station clicked');
        }
    ]);


    var ItemPanel = zebra.Class(EvStatePan, [

    ]);
    zebra.properties(ItemPanel, {
        padding: 8,
        psHeight: 60,
        layout: new FlowLayout(LEFT, CENTER, HORIZONTAL, 8).properties({
            stretchLast: true
        }),
        background: {
            'pressed.over' : new zebra.util.rgb(230, 230, 230),
            "over"         : new Gradient(new zebra.util.rgb(254, 254, 254), new zebra.util.rgb(224, 224, 224)),
            '*'            : 'white'
        }
    });

    var moneyInput = new ItemPanel({
        id: 'moneyInput',
        kids: [
            new ImagePan("img/icon_money.png", IMAGE_SIZE, IMAGE_SIZE),
            new HtmlTextInput('', 'input').properties({
                border: null,
                background: null,
                attributes: {
                    'type': 'number',
                    'placeholder': '请到站后输入金额'
                },
                styles: {
                    'padding': 0
                },
                'className': 'list_cell_text_input_money'
            })
        ]
    });
    var gunPicker = new ItemPanel({
        id: 'gunPicker',
        kids: [
            new ImagePan("img/icon_gun.png", IMAGE_SIZE, IMAGE_SIZE),
            new Label('请选择油枪号(请咨询加油员)').properties({
                color: "black",
                font: new Font(font, 16)
            }),
            new Panel({
                id: 'gunPicker_MorePanel',
                layout: new RasterLayout(USE_PS_SIZE),
                kids: {
                    RIGHT: new ImagePan("img/chakan.png", 10, 18)
                }
            })
        ]
    });
    var invoice = new ItemPanel({
        id: 'invoice',
        kids: [
            new ImagePan("img/icon_invoice.png", IMAGE_SIZE, IMAGE_SIZE),
            new Label('开发票').properties({
                color: "black",
                font: new Font(font, 16)
            }),
            new Panel({
                id: 'invoice_TogglePanel',
                layout: new RasterLayout(USE_PS_SIZE),
                kids: {
                    RIGHT: new SlideButton([
                        function onToggle(isOn) {
                            toggleInvoiceInput();
                        }
                    ]).properties({
                        id: 'invoice_SlideButton'
                    })
                }
            })
        ]
    }, [
        function pointerClicked(e) {
            this.kids[2].kids[0].toggle();
        },
        function childPointerClicked(e) {
            this.kids[2].kids[0].toggle();
        }
    ]);
    var coupon = new ItemPanel({
        id: 'coupon',
        kids: [
            new ImagePan("img/icon_coupon.png", IMAGE_SIZE, IMAGE_SIZE),
            new Label('请选择优惠油券').properties({
                color: "black",
                font: new Font(font, 16)
            }),
            new Panel({
                id: 'coupon_MorePanel',
                layout: new RasterLayout(USE_PS_SIZE),
                kids: {
                    RIGHT: new ImagePan("img/chakan.png", 10, 18)
                }
            })
        ]
    });

    function getInvoiceInput() {
        return new ItemPanel({
            id: 'invoiceInput',
            kids: [
                new HtmlTextInput('', 'input').properties({
                    border: null,
                    background: null,
                    attributes: {
                        'type': 'text',
                        'placeholder': '请输入发票抬头'
                    },
                    styles: {
                        'padding': 0,
                        'margin-left': '0.5rem'
                    }
                })
            ]
        });
    }

    var divider = new Panel({
        layout: new FlowLayout(LEFT, CENTER, HORIZONTAL, 0).properties({
            stretchLast: true
        }),
        kids: [
            new Line().properties({
                psWidth: 16,
                lineColors: ['white'],
                lineWidth: 1
            }),
            new Line().properties({
                lineColors: ['#eaeaea'],
                lineWidth: 1
            })
        ]
    });

    var group = new Panel({
        id: 'group',
        layout: new ListLayout(),
        kids: [
            moneyInput,
            zebra.clone(divider),
            gunPicker,
            zebra.clone(divider),
            invoice,
            zebra.clone(divider),
            coupon
        ]
    });

    function toggleInvoiceInput() {
        var INDEX = 6;
        if (INDEX < group.kids.length && group.kids[INDEX].id === 'invoiceInput') {
            group.removeAt(INDEX);
            group.removeAt(INDEX);
        } else {
            group.insert(INDEX, null, zebra.clone(divider));
            group.insert(INDEX, null, getInvoiceInput());
        }
    }

    var bottomBar = new Panel({
        layout: new BorderLayout(10),
        padding: 16,
        background: 'white',
        kids: {
            CENTER: new Panel({
                layout: new FlowLayout(LEFT, CENTER, VERTICAL, 10),
                kids: [
                    new BoldLabel('总计：￥0.00').properties({
                        color: 'black',
                        font: new Font(font, 'bold', 20)
                    }),
                    new Label('优惠：-￥0').properties({
                        color: 'red',
                        font: new Font(font, 16)
                    })
                ]
            }),
            RIGHT: new Panel({
                layout: new RasterLayout(USE_PS_SIZE),
                kids: {
                    CENTER: new Button(new Label('立即支付').properties({
                        color: 'white',
                        font: new Font(font, 20)
                    })).properties({
                        padding: [12,34,12,34],
                        background: '#f44335',
                        border: new Border('blue', 0.01, 4)
                    })
                }
            })
        }
    });


    var test = new Panel({
        id: 'test',
        layout: new PercentLayout(HORIZONTAL, 0, false),
        background: 'white',
        psHeight: 60,
        kids: [
            new Panel({
                layout: new RasterLayout(USE_PS_SIZE),
                constraints: 20,
                kids: {
                    LEFT: new EvStatePan({
                        id: 'left2',
                        view: {
                            'pressed.over': new CompRender(new ImagePan("img/back_p.png", IMAGE_SIZE, IMAGE_SIZE)),
                            '*': new CompRender(new ImagePan("img/back.png", IMAGE_SIZE, IMAGE_SIZE))
                        }
                    })
                }
            }),
            new Panel({
                layout: new RasterLayout(USE_PS_SIZE),
                constraints: 60,
                kids: {
                    CENTER: new Label(new Label("到站加油")).properties({
                        constraints: CENTER
                    })
                }
            }),
            new Panel({
                id: 'ttt',
                layout: new RasterLayout(USE_PS_SIZE),
                padding: 0,
                constraints: 20,
                kids: {
                    RIGHT: new EvStatePan({
                        id: 'right2',
                        view: {
                            'pressed.over': new CompRender(new ImagePan("img/order_person_press.png", IMAGE_SIZE, IMAGE_SIZE)),
                            '*': new CompRender(new ImagePan("img/order_person.png", IMAGE_SIZE, IMAGE_SIZE))
                        }
                    })
                }
            })
        ]
    });

    var test2 = new Panel({
        layout: new FlowLayout(RIGHT, STRETCH, HORIZONTAL, 2),
        background: 'white',
        psHeight: 130,
        kids: [
            new Checkbox("Checkbox").properties({
            }),
            new Label(new zebra.data.Text("Ri2\n2")).properties({
            }),
            new Label(new zebra.data.Text("Ri33\n2\n33")).properties({
            })
        ],
        focusMarkerView: new View([function () {
            function paint(g, x, y, w, h, c) {
                var step = 10;
                g.setColor("red");
                for (var i = 0; i < w / step; i++) {
                    g.drawLine(x + i * step, y,
                            x + i * step, y + h);
                }

                g.setColor("orange");
                for (var i = 0; i < h / step; i++) {
                    g.drawLine(x, y + i * step,
                            x + w, y + i * step);
                }
            }
        }])
    });

    var test3 = new Panel({
        layout: new RasterLayout(),
        padding: 0,
        background: 'white',
        kids: [
            new Button("Right-Center-Hor").properties({
                bounds: [0, 10, 180, 50],
                constraints: HORIZONTAL
            }),
            new Button("Right-Center-Hor22").properties({
                bounds: [40, 50, 180, 50]
            }),
            new Button("Right-Center-Hor333").properties({
                bounds: [90, 90, 180, 50]
            }),
            new Button("Right-Center-Hor333").properties({
                bounds: [250, 40, 90, 40]
            })
        ]
    });
    for (var i in test3.kids) {
        test3.kids[i].toPreferredSize();
    }

    var test4 = new Panel({
        layout: new RasterLayout(USE_PS_SIZE),
        padding: 0,
        background: 'white',
        kids: [
            new Button("multiple center view").properties({
                preferredSize: [200, 60],
                constraints: CENTER
            }),
            new Button("center").properties({
                constraints: CENTER
            })
        ]
    });


    var arr = [];
    arr.push(gasStation);
    arr.push(group);
//    arr.push(test);
//    arr.push(test2);
//    arr.push(test3);
//    arr.push(test4);

    var container = new Panel({
        id: 'list',
        layout: new ListLayout(10),
        top: 10,
        bottom: 10,
        constraints: STRETCH,
        kids: arr
    });
    var vscroll = new ScrollPan(container, 'vertical', true);

    var root = z.root.properties({
        id: 'root',
        layout: new BorderLayout(),
        background: '#F2F2F2',
        kids: {
            TOP: titleBar,
            CENTER: vscroll,
            BOTTOM: bottomBar
        }
//        kids: [container.properties({
//            bounds: [0, 0, z.width, z.height]
//        })]
    });

//    root.find('#change').extend([
//        function pointerClicked(e) {
//            console.log('================> change clicked');
//        }
//    ]);
}
