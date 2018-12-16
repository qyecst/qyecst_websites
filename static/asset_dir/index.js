// 严格模式
"use strict";

// 页面body的JQuery对象
const BODY = $("body");
// 页面一言JQuery对象
const HITOKOTO_CONTENT = $("#hitokoto_content");
// 页面左侧主体JQuery对象
const MAIN_CONTENT = $("#main_content");

// 还原get历史记录函数
window.onpopstate = function () {
    let state_obj = history.state;
    if (state_obj === null) return;
    $("html,body").animate({scrollTop: 0}, 500);
    $.get(state_obj.url, state_obj.data, function (res, status, xhr) {
        set_title_func(res.title);
        reload_hitokoto_func();
        MAIN_CONTENT.html(res.html);
        // 文章toc
        if (res.toc) {
            $("#toc_content").html(res.toc);
        }
        init_with_url();
    }, "json");
};
// 站内链接点击事件绑定
BODY.on("click", ".inner_link_mk", function () {
    get_submit_func($(this).attr("href"), {is_ajax: true});
    return false;
});
// 右侧toc点击事件绑定
BODY.on("click", ".inner_anchor_mk", function () {
    $("html, body").animate({scrollTop: $($(this).attr("href")).offset().top - 58}, 500);
    return false
});
// 导航栏搜索点击事件绑定
BODY.on("click", "#search_submit", function () {
    //取搜索值
    let text = $("#search_text").val();
    //非undefined/null/空格检测
    if (!text || !/\S.*/.test(text)) return false;  // 阻止提交
    let form = $("#search_form");
    get_submit_func(form.attr("action"), form.serialize());
    console.log(form);
    return false;  // 阻止提交
});
// 导航栏搜索回车事件绑定
BODY.on("keypress", "#search_text", function (event) {
    // 13为回车
    if (event.keyCode === 13) {
        //取搜索值
        let text = $("#search_text").val();
        //非undefined/null/空格检测
        if (!text || !/\S.*/.test(text)) return false;  // 阻止提交
        let form = $("#search_form");
        get_submit_func(form.attr("action"), form.serialize());
        return false;  // 阻止提交
    }
});
// region L2D菜单点击事件绑定
BODY.on("click", "#waifu_tool_go_top", function () {
    $("html,body").animate({scrollTop: 0}, 500);
});
BODY.on("click", "#waifu_tool_go_bottom", function () {
    $("html,body").animate({scrollTop: $(document).height() - $(window).height()}, 500);
});
BODY.on("click", "#waifu_tool_say_msg", function () {
    showHitokoto();
});
BODY.on("click", "#waifu_tool_ch_clothes", function () {
    loadlive2d("live2d", "/static/potion_maker/model.json");
});
BODY.on("click", "#waifu_tool_close", function () {
    let self = $("div.waifu");
    self.animate({opacity: 0}, 1000, "linear", function () {
        self.addClass("d-none");
    })
});
// endregion L2D菜单点击事件绑定
// 页面滚动事件绑定
BODY.on("click", ".page_up_div", function () {
    $("html,body").animate({scrollTop: 0}, 500);
});
// 页面滚动事件绑定
BODY.on("click", ".page_down_div", function () {
    $("html,body").animate({scrollTop: $(document).height() - $(window).height()}, 500);
});
// 文章二维码生成事件绑定
MAIN_CONTENT.on("mouseenter", ".qrcode_link", function () {
    let qr = qrcode(0, "H"), self = $(this);  // qrcode对象初始化，H容错30%
    qr.addData(self.data("qrcode_data"));
    qr.make();
    let img_obj = $(qr.createImgTag());
    self.attr("href", img_obj.attr("src"));
    self.siblings(".qrcode_div").html(img_obj.first());  // 图片放入div内
});
// 文章加载图片点击事件绑定
MAIN_CONTENT.on("click", ".load_image", function () {
    let self = $(this);
    self.removeClass("load_image");
    self.html(self.data("image_info"));
});


/** region ======== 复用函数依赖-复用 ======== */

// String属性添加
String.prototype.usr_str_fmt = function () {
    let args = arguments;
    return this.replace(/{(\d+)}/g, function (str, idx) {
        return args[idx];
    })
};

/** endregion ======== 复用函数依赖-复用 ======== */

/** region ======== 图片轮显-复用 ======== */

/**
 * 参考自("http://www.cnblogs.com/lianmin/p/4625835.html" @https://github.com/shalldie @谢爽)
 * <div id="element_id"></div> //=>初始化里设置
 * 依赖JQuery，自定义string格式化函数，css样式
 * 使用
 $(function () {
    new Slider({
        id: "qyecst_show_images",
        images: [
            "1/5.jpg",
            "1/6.jpg",
            "1/7.jpg",
            "1/8.jpg",
            "1/9.jpg",
            "1/10.jpg",
            "1/11.jpg",
            "1/12.jpg",
            "1/1.jpg",
            "1/2.jpg",
            "1/3.jpg",
            "1/4.jpg"
        ],
        interval: 5000,
        delay: 3000,
        x_count: 6,
        y_count: 7,
        x_y_scale: 1.57 / 2
    });
});
 */

// JQuery添加缓动函数 ("http://gsgd.co.uk/sandbox/jquery/easing/", "BSD License")
$.extend($.easing, {
    easeOutBounce: function (x, t, b, c, d) {
        if ((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b
        } else {
            if (t < (2 / 2.75)) {
                return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b
            } else {
                if (t < (2.5 / 2.75)) {
                    return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b
                } else {
                    return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b
                }
            }
        }
    }
});

// 轮显类
class Slider {
    // 构造函数
    constructor(opt) {
        this.init_func(opt);
    }

    // 初始化
    init_func(opt) {
        this.option = $.extend(true, {
            id: "",  // 元素id
            show_border: true,  // 显示框线
            images: [],  // 图片url组
            x_count: 3,  // x方向模块数量
            y_count: 5,  // y方向模块数量
            x_y_scale: 1 / 2,  // 宽高比例
            delay: 2200,  // 所有方块动画触发总时间 ms 1000即1秒
            interval: 5000,  // 图片轮显间隔 ms 1000即1秒
            box_cls: "slider_box",  // 定义的box框css类名字
            cube_cls: "slider_cube",  // 定义的cube方块css类名字
            inner_a_cls: "slider_inner_a",  // 定义的inner_a方块css类名字
            inner_b_cls: "slider_inner_b"  // 定义的inner_b方块css类名字
        }, opt);  // 默认参数
        this.ele_outer = $("#{0}".usr_str_fmt(this.option.id));  // 设定的轮显元素
        //==================
        this.cube_size = {width: 0, height: 0};  // 生成的效果方块大小
        this.now_image_index = 0;   // 当前图片索引
        this.effect_index = 0;  // 当前切换效果索引
        this.effects = [
            // 0每个上到下弹跳
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                let cube_height = self.cube_size.height;
                // ==================
                let cube_delay = D / (X * Y);  // 触发间隔
                let ani_delay = D / 2;  // 动画时间
                // 效果函数
                self.select_anime_element(0, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "top": "{0}px".usr_str_fmt(-cube_height),
                        "background-image": "url({0})".usr_str_fmt(url),
                    }).delay(delay_queue).animate({
                        "top": "0"
                    }, ani_delay, "easeOutBounce", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 1每个依次顺序渐入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                // ==================
                let cube_delay = D / (X * Y);  // 触发间隔
                let ani_delay = D / 5;  // 动画时间
                // 效果函数
                self.select_anime_element(0, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "opacity": "0",
                        "background-image": "url({0})".usr_str_fmt(url)
                    }).delay(delay_queue).animate({
                        "opacity": "1"
                    }, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 2每个乱序随机滑入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                let cube_height = self.cube_size.height;
                let cube_width = self.cube_size.width;
                // ==================
                let ani_delay = D / 8;  // 动画时间
                let delay_arr = [0];
                let cube_delay = D / (X * Y);
                for (let i = 1; i < X * Y; ++i) {
                    delay_arr[i] = delay_arr[i - 1] + cube_delay;
                }
                delay_arr.sort(function (a, b) {  // 生成乱序延迟时间
                    return Math.random() > 0.5 ? 1 : -1;
                });
                // 效果函数
                self.select_anime_element(0, function (inner_a, inner_b, cube_num, direct) {
                    // 随机方向
                    let direct_idx = Math.floor(Math.random() * 4);  // 0-上，1-右，2-下，3-左
                    let css_direct = ["top", "left", "top", "left"][direct_idx];  // 属性名称
                    let css_value = [cube_height, -cube_width, -cube_height, cube_width][direct_idx];  // 一起始值，二取反
                    let obj = {};
                    obj[css_direct] = "{0}px".usr_str_fmt(css_value);
                    obj["background-image"] = "url({0})".usr_str_fmt(url);
                    inner_a.css(obj);
                    let delay_queue = delay_arr[cube_num];
                    obj = {};
                    obj[css_direct] = "0";
                    inner_a.delay(delay_queue).animate(obj, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 3总体顺时针渐入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                // ==================
                let cube_delay = D / (X * Y);  // 触发间隔
                let ani_delay = D / 5;  // 动画时间
                // 效果函数
                self.select_anime_element(1, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "opacity": "0",
                        "background-image": "url({0})".usr_str_fmt(url)
                    }).delay(delay_queue).animate({
                        "opacity": "1"
                    }, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 4总体顺时针滑入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                let cube_height = self.cube_size.height;
                let cube_width = self.cube_size.width;
                // ==================
                let cube_delay = D / (X * Y);  // 触发间隔
                let ani_delay = D / 5;  // 动画时间
                // 效果函数
                self.select_anime_element(1, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    let css_direct = ["top", "left", "top", "left"][direct];  // 属性名称，上右下左
                    let css_value = [cube_height, -cube_width, -cube_height, cube_width][direct];  // 一起始值，二取反
                    let obj = {};
                    obj[css_direct] = "{0}px".usr_str_fmt(css_value);
                    obj["background-image"] = "url({0})".usr_str_fmt(url);
                    inner_a.css(obj);
                    obj = {};
                    obj[css_direct] = "0";
                    inner_a.delay(delay_queue).animate(obj, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 5双行反向渐入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                // ==================
                let cube_delay = 0;  // 触发间隔
                let ani_delay = D / 6;  // 动画时间
                if (Y % 2 === 0) {
                    cube_delay = D / (X * Math.floor(Y / 2));
                } else {
                    cube_delay = D / (X * Math.ceil(Y / 2));
                }
                // 效果函数
                self.select_anime_element(2, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "opacity": "0",
                        "background-image": "url({0})".usr_str_fmt(url)
                    }).delay(delay_queue).animate({
                        "opacity": "1"
                    }, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 6双行反向滑入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                let cube_height = self.cube_size.height;
                let cube_width = self.cube_size.width;
                // ==================
                let cube_delay = 0;  // 触发间隔
                let ani_delay = D / 4;  // 动画时间
                if (Y % 2 === 0) {
                    cube_delay = D / (X * Math.floor(Y / 2));
                } else {
                    cube_delay = D / (X * Math.ceil(Y / 2));
                }
                // 效果函数
                self.select_anime_element(2, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    let css_direct = ["top", "left", "top", "left"][direct];  // 属性名称，右左
                    let css_value = [cube_height, -cube_width, -cube_height, cube_width][direct];  // 一起始值，二取反
                    let obj = {};
                    obj[css_direct] = "{0}px".usr_str_fmt(css_value);
                    obj["background-image"] = "url({0})".usr_str_fmt(url);
                    inner_a.css(obj);
                    obj = {};
                    obj[css_direct] = "0";
                    inner_a.delay(delay_queue).animate(obj, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 7头尾螺旋渐入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                // ==================
                let cube_delay = 0;  // 触发间隔
                let ani_delay = D / 6;  // 动画时间
                if (Y % 2 === 0) {
                    cube_delay = D / (X * Math.floor(Y / 2));
                } else {
                    cube_delay = D / (X * Math.ceil(Y / 2));
                }
                // 效果函数
                self.select_anime_element(3, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "opacity": "0",
                        "background-image": "url({0})".usr_str_fmt(url)
                    }).delay(delay_queue).animate({
                        "opacity": "1"
                    }, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 8头尾螺旋滑入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                let cube_height = self.cube_size.height;
                let cube_width = self.cube_size.width;
                // ==================
                let cube_delay = 0;  // 触发间隔
                let ani_delay = D / 4;  // 动画时间
                if (Y % 2 === 0) {
                    cube_delay = D / (X * Math.floor(Y / 2));
                } else {
                    cube_delay = D / (X * Math.ceil(Y / 2));
                }
                // 动画函数
                self.select_anime_element(3, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    let css_direct = ["top", "left", "top", "left"][direct];  // 属性名称，右左
                    let css_value = [cube_height, -cube_width, -cube_height, cube_width][direct];  // 一起始值，二取反
                    let obj = {};
                    obj[css_direct] = "{0}px".usr_str_fmt(css_value);
                    obj["background-image"] = "url({0})".usr_str_fmt(url);
                    inner_a.css(obj);
                    obj = {};
                    obj[css_direct] = "0";
                    inner_a.delay(delay_queue).animate(obj, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 9i=x+y斜线渐入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                // ==================
                let cube_delay = D / (X + Y - 2);  // 触发间隔
                let ani_delay = D / 4;  // 动画时间
                // 效果函数
                self.select_anime_element(4, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "opacity": "0",
                        "background-image": "url({0})".usr_str_fmt(url)
                    }).delay(delay_queue).animate({
                        "opacity": "1"
                    }, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 10i=x+y斜线滑入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                let cube_width = self.cube_size.width;
                let cube_height = self.cube_size.height;
                // ==================
                let cube_delay = D / (X + Y - 2);  // 触发间隔
                let ani_delay = D / 2;  // 动画时间
                // 效果函数
                self.select_anime_element(4, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "left": "{0}px".usr_str_fmt(-cube_width),
                        "top": "{0}px".usr_str_fmt(-cube_height),
                        "background-image": "url({0})".usr_str_fmt(url)
                    }).delay(delay_queue).animate({
                        "left": "0",
                        "top": "0"
                    }, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 11i=x+y斜线反向渐入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                // ==================
                let cube_delay = D / (X * Y);  // 触发间隔
                let ani_delay = D / 6;  // 动画时间
                // 效果函数
                self.select_anime_element(5, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "opacity": "0",
                        "background-image": "url({0})".usr_str_fmt(url)
                    }).delay(delay_queue).animate({
                        "opacity": "1"
                    }, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            },
            // 12i=x+y斜线反向滑入
            function (self, url) {
                // 参数
                let X = self.option.x_count;
                let Y = self.option.y_count;
                let D = self.option.delay;
                let cube_width = self.cube_size.width;
                let cube_height = self.cube_size.height;
                // ==================
                let cube_delay = D / (X * Y);  // 触发间隔
                let ani_delay = cube_delay * 3;  // 动画时间
                // 效果函数
                self.select_anime_element(5, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    if (direct === 4) {
                        inner_a.css({
                            "left": "{0}px".usr_str_fmt(-cube_width), /* 不同 */
                            "top": "{0}px".usr_str_fmt(cube_height), /* 不同 */
                            "background-image": "url({0})".usr_str_fmt(url)
                        }).delay(delay_queue).animate({
                            "left": "0",
                            "top": "0"
                        }, ani_delay, "swing", function () {
                            inner_b.css({
                                "background-image": "url({0})".usr_str_fmt(url)
                            });
                        });
                    } else {
                        inner_a.css({
                            "left": "{0}px".usr_str_fmt(cube_width), /* 不同 */
                            "top": "{0}px".usr_str_fmt(-cube_height), /* 不同 */
                            "background-image": "url({0})".usr_str_fmt(url)
                        }).delay(delay_queue).animate({
                            "left": "0",
                            "top": "0"
                        }, ani_delay, "swing", function () {
                            inner_b.css({
                                "background-image": "url({0})".usr_str_fmt(url)
                            });
                        });
                    }
                });
            },
            // 13每列左到右滑入
            function (self, url) {
                //参数
                let X = self.option.x_count;
                let D = self.option.delay;
                let cube_width = self.cube_size.width;
                // ==================
                let cube_delay = D / X;  // 触发间隔
                let ani_delay = D / 2;  // 动画时间
                // 效果函数
                self.select_anime_element(6, function (inner_a, inner_b, cube_num, direct) {
                    let delay_queue = cube_num * cube_delay;
                    inner_a.css({
                        "left": "{0}px".usr_str_fmt(-cube_width),
                        "background-image": "url({0})".usr_str_fmt(url)
                    }).delay(delay_queue).animate({
                        "left": "0"
                    }, ani_delay, "swing", function () {
                        inner_b.css({
                            "background-image": "url({0})".usr_str_fmt(url)
                        });
                    });
                });
            }
        ];  // 轮显效果
        this.timer_ele = $("<div></div>");  // 计时用元素，使用animate控制轮显间隔，避免浏览器tab失焦使得js积累，切回tab后动画飞快
        this.box_class = this.option.box_cls;  // 定义的box框css类名字
        this.cube_class = this.option.cube_cls;  // 定义的cube方块css类名字
        this.inner_a_class = this.option.inner_a_cls;  // 定义的inner_a方块css类名字
        this.inner_b_class = this.option.inner_b_cls;  // 定义的inner_b方块css类名字
        /** 初始化 */
        this.fill_anime_element();
        this.resize_element();
        this.bind_events();
        /** 开始 */
        this.start_show();
    }

    // 下张图片index
    next_image_index() {
        // 参数
        let images_length = this.option.images.length;
        let new_idx = this.now_image_index + 1;
        // ==================
        if (new_idx >= images_length) new_idx = 0;
        return new_idx;
    }

    // 填充效果方块
    fill_anime_element() {
        // 参数
        let X = this.option.x_count;
        let Y = this.option.y_count;
        let ele_id = this.option.id;
        let box_cls = this.box_class;
        let cube_cls = this.cube_class;
        let inner_a_cls = this.inner_a_class;
        let inner_b_cls = this.inner_b_class;
        // ==================
        let ele_inner = "";  // 填充的元素
        for (let x = 0; x < X; ++x) {
            for (let y = 0; y < Y; ++y) {
                // inner_a为效果方块，inner_b为显示方块，故而inner_a写在后，叠加在inner_b上方
                ele_inner += '<div id="{0}_{1}_{2}" class="{3}"><div class="{4}"></div><div class="{5}"></div></div>'.usr_str_fmt(ele_id, x, y, cube_cls, inner_b_cls, inner_a_cls);
            }
        }
        let temp_ele_box = '<div class="{0}">{1}</div>'.usr_str_fmt(box_cls, ele_inner);  // 带上外部box框
        // ==================
        this.ele_outer.html(temp_ele_box);  // 填充元素
        this.ele_box = this.ele_outer.children(".{0}".usr_str_fmt(box_cls));  // 获取添加的box框对象
    }

    // 选取效果方块
    select_anime_element(type, callback) {
        // 参数
        let ele_id = this.option.id;  // 方块id
        let X = this.option.x_count;  // X方向个数
        let Y = this.option.y_count;  // Y方向个数
        let inner_a_cls = this.inner_a_class;
        let inner_b_cls = this.inner_b_class;
        // ==================
        let direct_arr = [0, 1, 2, 3, 4, 5, 6, 7];  // 方向，0上 1右 2下 3左 4上右 5右下 6下左 7左上
        // 顺序选取，1 2 3 4 5 6 7 8 9  // callback(inner_a, inner_b, cube_num, direct);
        if (type === 0) {
            let x_max = X - 1, y_max = Y - 1;  // 最大坐标
            let cube_num = 0;  // 选取序号
            for (let y = 0; y <= y_max; ++y) {
                for (let x = 0; x <= x_max; ++x) {
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, y));
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[1]);
                    ++cube_num;
                }
            }
        }
        // 顺时针选取，1 2 3 6 9 8 7 4 5  // callback(inner_a, inner_b, cube_num, direct);
        if (type === 1) {
            let x_min = 0, y_min = 0;  // 最小坐标
            let x_max = X - 1, y_max = Y - 1;  // 最大坐标
            let cube_num = 0, all_cube_num = X * Y;  // 选取序号，总序号
            while (cube_num < all_cube_num) {  // 利用总选取次数和已选次数控制循环
                for (let x = x_min; x <= x_max; ++x) {
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, y_min));  // 最上 左到右一个
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[x === x_max ? 2 : 1]);
                    ++cube_num;
                }
                ++y_min;  // 上述循环后y方向少了一行
                if (cube_num >= all_cube_num) continue;
                for (let y = y_min; y <= y_max; ++y) {
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_max, y));  // 最右 上到下一个
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[y === y_max ? 3 : 2]);
                    ++cube_num;
                }
                --x_max;  // 上述循环后x方向少了一列
                if (cube_num >= all_cube_num) continue;
                for (let x = x_max; x >= x_min; --x) {
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, y_max));  // 最下 右到左一个
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[x === x_min ? 0 : 3]);
                    ++cube_num;
                }
                --y_max;  // 上述循环后y方向少了一行
                if (cube_num >= all_cube_num) continue;
                for (let y = y_max; y >= y_min; --y) {
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_min, y));  // 最左 下到上一个
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[y === y_min ? 1 : 0]);
                    ++cube_num;
                }
                ++x_min;  // 上述循环后x方向少了一列
            }
        }
        // 双行反向选取，(1 9) (2 8) (3 7) 4 5 6  // callback(inner_a, inner_b, cube_num, direct);
        if (type === 2) {
            let x_max = X - 1, y_max = Y - 1;  // 最大坐标
            let cube_num = 0;//选取序号
            let loop_num = Math.floor(Y / 2);  // 循环次数，为y方向行数/2向下取整
            for (let i = 0; i < loop_num; ++i) {
                if (i % 2 === 0) {  // 偶数次循环 0 2 4
                    for (let j = 0; j <= x_max; ++j) {
                        let direct_idx = 1;
                        let direct_idx2 = 3;
                        if (j === 0 && i !== 0) {
                            direct_idx = 2;
                            direct_idx2 = 0;
                        }
                        if (j === x_max && i !== loop_num - 1) {
                            direct_idx = 2;
                            direct_idx2 = 0;
                        }
                        if (i === loop_num - 1 && j === x_max && Y % 2 !== 0) {
                            direct_idx = 2;
                            direct_idx2 = 0;
                        }
                        // 上述滑动方向确定
                        let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, j, i));  // 选取最上 左到右一个
                        let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a, inner_b, cube_num, direct_arr[direct_idx]);
                        let ele_box2 = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_max - j, y_max - i));  // 选取最下 右到左一个
                        let inner_a2 = ele_box2.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b2 = ele_box2.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a2, inner_b2, cube_num, direct_arr[direct_idx2]);
                        ++cube_num;
                    }
                } else {  // 奇数次循环 1 3 5
                    for (let j = 0; j <= x_max; ++j) {
                        let direct_idx = 3;
                        let direct_idx2 = 1;
                        if (j === 0) {
                            direct_idx = 2;
                            direct_idx2 = 0;
                        }
                        if (j === x_max && i !== loop_num - 1) {
                            direct_idx = 2;
                            direct_idx2 = 0;
                        }
                        if (i === loop_num - 1 && j === x_max && Y % 2 !== 0) {
                            direct_idx = 2;
                            direct_idx2 = 0;
                        }
                        // 上述滑动方向确定
                        let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_max - j, i));  // 选取最上 右到左一个
                        let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a, inner_b, cube_num, direct_arr[direct_idx]);
                        let ele_box2 = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, j, y_max - i));  // 选取最下 左到右一个
                        let inner_a2 = ele_box2.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b2 = ele_box2.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a2, inner_b2, cube_num, direct_arr[direct_idx2]);
                        ++cube_num;
                    }
                }
            }
            if (Y % 2 !== 0) {  // 总行数为奇数时添加上述后剩余的一行
                if (X % 2 === 0) {  // 行元素个数为偶数时
                    for (let e = 0; e < X / 2; ++e) {
                        let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, e, loop_num));  // 选取最上 左到右一个
                        let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a, inner_b, cube_num, direct_arr[1]);
                        let ele_box2 = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_max - e, loop_num));  // 选取最上 右到左一个
                        let inner_a2 = ele_box2.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b2 = ele_box2.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a2, inner_b2, cube_num, direct_arr[3]);
                        ++cube_num;
                    }
                } else {  // 行元素个数为奇数时
                    for (let e = 0; e < Math.floor(X / 2); ++e) {
                        let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, e, loop_num));  // 选取最上 左到右一个
                        let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a, inner_b, cube_num, direct_arr[1]);
                        let ele_box2 = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_max - e, loop_num));  // 选取最上 右到左一个
                        let inner_a2 = ele_box2.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b2 = ele_box2.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a2, inner_b2, cube_num, direct_arr[3]);
                        ++cube_num;
                    }
                    // 多出的一个元素
                    let ele_box3 = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, Math.floor(X / 2), loop_num));  // 选取最上 左到右一个
                    let inner_a3 = ele_box3.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b3 = ele_box3.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a3, inner_b3, cube_num, direct_arr[1]);
                    ++cube_num;
                }
            }
        }
        // 头尾螺旋选取，(1 9) (2 8) (3 7) (4 6) 5  // callback(inner_a, inner_b, cube_num, direct);
        if (type === 3) {
            let x_min = 0, y_min = 0;  // 最小坐标
            let x_max = X - 1, y_max = Y - 1;  // 最大坐标
            let cube_num = 0, count = 0, all_count_num = X * Y;  // 选取序号，方块计数，总计数
            while (count < all_count_num) {
                for (let j = 0, x = x_min; x <= x_max; ++x, ++j) {  // 双向取值，因为两边一起取值，互相影响，另设j记录偏移量
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, y_min));  // 选取最上 左到右一个
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[x === x_max ? 2 : 1]);
                    if (++count >= all_count_num) continue;
                    let ele_box2 = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_max - j, y_max));  // 选取最下 右到左一个
                    let inner_a2 = ele_box2.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b2 = ele_box2.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a2, inner_b2, cube_num, direct_arr[x === x_max ? 0 : 3]);
                    ++count;
                    ++cube_num;
                }
                ++y_min;  // 上述循环后y方向少了一行
                --y_max;  // 上述循环后y方向少了一行
                for (let i = 0, y = y_min; y <= y_max; ++y, ++i) {  // 双向取值，因为两边一起取值，互相影响，另设i记录偏移量
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_max, y));  // 选取最右 上到下一个
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[y === y_max ? 3 : 2]);
                    if (++count >= all_count_num) continue;
                    let ele_box2 = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x_min, y_max - i));  // 选取最左 下到上一个
                    let inner_a2 = ele_box2.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b2 = ele_box2.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a2, inner_b2, cube_num, direct_arr[y === y_max ? 1 : 0]);
                    ++count;
                    ++cube_num;
                }
                ++x_min;  // 上述循环后x方向少了一列
                --x_max;  // 上述循环后x方向少了一列
            }
        }
        // 斜线选取，1 (4 2) (7 5 3) (8 6) 9  // callback(inner_a, inner_b, cube_num, direct);
        if (type === 4) {
            let x_max = X - 1, y_max = Y - 1;  // 最大坐标
            let cube_num = 0;  // 选取序号
            for (let i = 0; i <= x_max + y_max; ++i) {  // i=x+y这条线进行选取
                for (let x = 0; x <= x_max; ++x) {
                    if (x > i) break;  // 若x>i则后面无需查找了
                    if (x < i - y_max) continue;  // 若x < i - y_max则当前x取不到y
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, i - x));
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[5]);
                }
                ++cube_num;
            }
        }
        // 斜线反向选取，1 2 4 7 5 3 6 8 9  // callback(inner_a, inner_b, cube_num, direct);
        if (type === 5) {
            let x_max = X - 1, y_max = Y - 1;  // 最大坐标
            let cube_num = 0;  // 选取序号
            for (let i = 0; i <= x_max + y_max; ++i) {  // i=x+y这条线进行选取
                if (i % 2 === 0) {
                    for (let x = 0; x <= x_max; ++x) {
                        if (x > i) break;  // 若x>i则后面无需查找了
                        if (x < i - y_max) continue;  // 若x < i - y_max则当前x取不到y
                        let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, i - x));
                        let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a, inner_b, cube_num, direct_arr[4]);
                        ++cube_num;
                    }
                } else {
                    for (let x = x_max; x >= 0; --x) {
                        if (x > i) continue;  // 若x>i则当前x取不到y
                        if (x < i - y_max) break;  // 若x < i - y_max则后面无需查找了
                        let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, i - x));
                        let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                        let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                        callback(inner_a, inner_b, cube_num, direct_arr[6]);
                        ++cube_num;
                    }
                }
            }
        }
        // 顺序选取，1 2 3 4 5 6 7 8 9  // callback(inner_a, inner_b, cube_num, direct);
        if (type === 6) {
            let x_max = X - 1, y_max = Y - 1;  // 最大坐标
            let cube_num = 0;  // 选取序号
            for (let x = 0; x <= x_max; ++x) {
                for (let y = 0; y <= y_max; ++y) {
                    let ele_box = $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, y));
                    let inner_a = ele_box.children(".{0}".usr_str_fmt(inner_a_cls));
                    let inner_b = ele_box.children(".{0}".usr_str_fmt(inner_b_cls));
                    callback(inner_a, inner_b, cube_num, direct_arr[1]);
                }
                ++cube_num;
            }
        }
    }

    // 调整大小
    resize_element() {
        // 参数
        let X = this.option.x_count;  // X方向个数
        let Y = this.option.y_count;  // Y方向个数
        let ele_id = this.option.id;
        let images_list = this.option.images;
        let now_image_idx = this.now_image_index;
        let XYS = this.option.x_y_scale;
        this.ele_box.height(this.ele_box.width() / XYS);  // 高度调整
        let ele_w = this.ele_box.width();
        let ele_h = this.ele_box.height();
        if (this.option.show_border) {
            this.cube_size.width = (ele_w - X + 1) / X;
            this.cube_size.height = (ele_h - Y + 1) / Y;
        } else {
            this.cube_size.width = (ele_w) / X;
            this.cube_size.height = (ele_h) / Y;
        }
        let cube_width = this.cube_size.width;
        let cube_height = this.cube_size.height;
        let inner_a_cls = this.inner_a_class;
        let inner_b_cls = this.inner_b_class;
        if (this.option.show_border) {
            for (let x = 0; x < X; ++x) {
                for (let y = 0; y < Y; ++y) {
                    $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, y)).css({
                        "left": "{0}px".usr_str_fmt(x * cube_width + x),
                        "top": "{0}px".usr_str_fmt(y * cube_height + y),
                        // "left": "{0}px".usr_str_fmt(x * cube_width),
                        // "top": "{0}px".usr_str_fmt(y * cube_height),
                        "width": "{0}px".usr_str_fmt(cube_width),
                        "height": "{0}px".usr_str_fmt(cube_height)
                    }).find(".{0},.{1}".usr_str_fmt(inner_a_cls, inner_b_cls)).css({
                        "background-image": "url({0})".usr_str_fmt(images_list[now_image_idx]),
                        "background-position": "{0}px {1}px".usr_str_fmt(-x * cube_width, -y * cube_height),
                        "background-size": "{0}px {1}px".usr_str_fmt(ele_w, ele_h)
                    });
                }
            }
        } else {
            for (let x = 0; x < X; ++x) {
                for (let y = 0; y < Y; ++y) {
                    $("#{0}_{1}_{2}".usr_str_fmt(ele_id, x, y)).css({
                        // "left": "{0}px".usr_str_fmt(x * cube_width + x),
                        // "top": "{0}px".usr_str_fmt(y * cube_height + y),
                        "left": "{0}px".usr_str_fmt(x * cube_width),
                        "top": "{0}px".usr_str_fmt(y * cube_height),
                        "width": "{0}px".usr_str_fmt(cube_width),
                        "height": "{0}px".usr_str_fmt(cube_height)
                    }).find(".{0},.{1}".usr_str_fmt(inner_a_cls, inner_b_cls)).css({
                        "background-image": "url({0})".usr_str_fmt(images_list[now_image_idx]),
                        "background-position": "{0}px {1}px".usr_str_fmt(-x * cube_width, -y * cube_height),
                        "background-size": "{0}px {1}px".usr_str_fmt(ele_w, ele_h)
                    });
                }
            }
        }

    }

    // 绑定事件
    bind_events() {
        let self = this;
        $(window).resize(function () {
            self.resize_element();
        });
    }

    // 更换图片
    change_image(idx) {
        // 切换图片
        // if (idx === this.now_image_index) return;
        this.now_image_index = idx;
        let url = this.option.images[idx];
        // 随机切换效果
        // let effect_idx = Math.floor(Math.random() * this.effects.length);
        // if (effect_idx >= this.effects.length) effect_idx = 0;
        // this.effects[effect_idx](this, url);
        // 顺序切换效果
        this.effects[this.effect_index++](this, url);
        if (this.effect_index >= this.effects.length) this.effect_index = 0;
        // 指定切换效果
        // this.effects[13](this, url);
    }

    // _开始
    _start_show() {
        let self = this;
        this.timer_ele.css({
            "opacity": "1"
        }).animate({
            "opacity": "0"
        }, this.option.interval, "linear", function () {
            self.change_image(self.next_image_index());
            self._start_show();
        });
    }

    // 开始
    start_show() {
        if (this.show_handle) return;
        this._start_show();
        this.show_handle = "showing";
    }

    // 停止
    stop_show() {
        this.timer_ele.stop(true);
        this.resize_element();
        this.show_handle = null;
    }
}

/** endregion ======== 图片轮显-复用 ======== */

/** region ======== 计算时间-复用 ======== */

/**
 * <div id="element_id"></div> //=>初始化里设置
 * 依赖JQuery，自定义string格式化函数
 * 使用
 $(function () {
    new Running({
        id: "qyecst_running_time",
        start: "2017-11-30",
        interval: 1000
    });
});
 */

// 计算时间类
class Running {
    // 构造函数
    constructor(opt) {
        this.init_func(opt);
        this.start_show();
    }

    // 初始化
    init_func(opt) {
        this.option = $.extend(true, {
            id: "",  // 元素id
            start: "",  // 开始时间 yyyy-mm-dd 2018-01-01
            interval: 1000  // 间隔 ms 1000即1秒
        }, opt);
        this.start_time = new Date(this.option.start).getTime();
        this.ele = $("#{0}".usr_str_fmt(this.option.id));
        this.timer_ele = $("<div></div>");  // 计时用元素，使用animate控制间隔
    }

    // 计算
    calc_time() {
        let past_time = new Date().getTime() - this.start_time;
        let days = Math.floor(past_time / 86400000);  // 过去天数  3600*24*1000=>24h
        let days_left = past_time % 86400000;  // 剩余毫秒
        let hours = Math.floor(days_left / 3600000);  // 过去小时  3600*1000=>1h
        let hours_left = days_left % 3600000;  // 剩余毫秒
        let mins = Math.floor(hours_left / 60000);  // 过去分钟  60*1000=>1min
        let mins_left = hours_left % 60000;  // 剩余毫秒
        let secs = Math.floor(mins_left / 1000);  // 过去秒  1*1000=>1s
        this.ele.html("{0}天{1}时{2}分{3}秒".usr_str_fmt(days, hours, mins, secs));
    }

    // _开始
    _start_show() {
        let self = this;
        self.calc_time();
        this.timer_ele.css({
            "opacity": "1"
        }).animate({
            "opacity": "0"
        }, this.option.interval, "linear", function () {
            self._start_show();
        });
    }

    // 开始
    start_show() {
        if (this.show_handle) return;
        this._start_show();
        this.show_handle = "calculating"
    }

    // 停止
    stop_show() {
        this.timer_ele.stop(true);
        this.show_handle = null;
    }
}

/** endregion ======== 计算时间-复用 ======== */

/** region ======== 时间线动画-复用 ======== */

/**
 * <div id="element_id">...(详见css使用格式)</div> //=>初始化里设置
 * 依赖JQuery，自定义string格式化函数，css样式
 * 使用
 $(function () {
    new Timeline({
        id: "about_time_line"
    });
});
 */

// 时间线动画类
class Timeline {

    // 构造函数
    constructor(opt) {
        this.init_func(opt);
    }

    // 初始化
    init_func(opt) {
        this.option = $.extend(true, {
            id: ""  // 元素id
        }, opt);
        this.timer = $("<div></div>");  // 计时器
        this.outer_element = $("#{0}".usr_str_fmt(this.option.id));  // 元素本身
        this.item_list = this.outer_element.children(".time_line_item");  // 项目列表
        this.bind_events();  // 绑定事件
    }

    // 绑定事件
    bind_events() {
        // 变量
        let self = this, win_obj = $(window);

        // 如果一开始就在可视区域，不需要绑定scroll事件
        if (self.outer_element.offset().top < win_obj.scrollTop() + win_obj.height()) {
            self.start_show();
            return;
        }

        // region ====== 绑定scroll事件 ======

        // 判断元素是否进入可视区域，临时函数，委托$(window) -> scroll，命名便于取消
        function tmp_func() {
            if (self.outer_element.offset().top < win_obj.scrollTop() + win_obj.height()) {
                self.start_show();
                win_obj.off("scroll", tmp_func);  // 取消委托
            }
        }

        // 委托
        win_obj.on("scroll", tmp_func);

        // endregion ====== 绑定scroll事件 ======
    }

    // 开始，使用timer控制间隔
    _start_show(item_list) {
        if (item_list.length > 0) {  // 判断还有剩余元素
            let now_item = item_list.first(), self = this;
            now_item.addClass("time_line_js");  // 效果类
            this.timer.css({opacity: 1}).animate({opacity: 0}, 1000, "linear", function () {
                self._start_show(item_list.next());  // 回调
            });
        }
    }

    // 开始
    start_show() {
        if (this.show_handle) return;
        this._start_show(this.item_list);
        this.show_handle = "showing";
    }

    // 停止
    stop_show() {
        this.timer.stop(true);
        this.show_handle = null;
    }
}

/** endregion ======== 时间线动画-复用 ======== */

// 保存get历史记录函数
function save_history_func(url, data, title) {
    history.pushState({
        url: url,
        title: title,
        data: $.extend({}, data, {is_ajax: true})  // is_ajax覆盖data
    }, title, url);
}

// 设置标题函数
function set_title_func(str) {
    if (str) document.title = "{0} - 没名字才是好名字".usr_str_fmt(str);
    else document.title = "没名字才是好名字";
}

// get请求函数
function get_submit_func(url, data) {
    data = $.extend({}, {is_ajax: true}, data); // data覆盖is_ajax:true
    $("html,body").animate({scrollTop: 0}, 500);
    $.get(url, data, function (res, status, xhr) {
        set_title_func(res.title);
        reload_hitokoto_func();
        MAIN_CONTENT.html(res.html);
        // 文章toc
        if (res.toc) {
            $("#toc_content").html(res.toc);
        }
        save_history_func(url, data, res.title);
        init_with_url();
    }, "json");
}

// 更新hitokoto信息
function reload_hitokoto_func() {
    $.get(HITOKOTO_CONTENT.data("hitokoto_url"), {is_ajax: true}, function (res, st, xhr) {
        HITOKOTO_CONTENT.html('<span data-toggle="tooltip" data-placement="bottom" data-html="true" class="font-weight-bold small" title="<span class=\'small\'>来自：{0}<br/>收集：{1}</span>"><i class="fa fa-quote-left fa-fw"></i><span>{2}</span></span>'.usr_str_fmt(res.where, res.create, res.hitokoto));
        HITOKOTO_CONTENT.children("[data-toggle='tooltip']").tooltip();
    }, "json");
}

// 文章页面toc显示
function post_init() {
    $("#right_content .toc_box").removeClass("d-none");
}

// 关闭文章页面toc显示
function post_dispose() {
    $("#right_content .toc_box").addClass("d-none");
}

// 关于页面时间线动画
function about_init() {
    $(function () {
        new Timeline({
            id: "qyecst_about_time_line"
        });
    });
}

// 初始化
function init_with_url() {
    let now_url = document.location.href;
    // 文章初始化
    if (/\/post\//.test(now_url)) {
        post_init();
    } else {
        post_dispose();
    }
    // 关于初始化
    if (/about\.html/.test(now_url)) {
        about_init();
    }
}

// 初始化tooltips
$(function () {
    $("[data-toggle='tooltip']").tooltip();
});
// 显示运行时间
$(function () {
    new Running({
        id: "qyecst_running_time",
        start: "2016-11-27",
        interval: 1000
    });
});
// 初始化
$(function () {
    init_with_url();
    save_history_func(document.location.href.replace(document.location.origin, ""), {is_ajax: true}, document.title.split('-')[0].trim());
});
// 显示轮显图片
$(function () {
    new Slider({
        id: "qyecst_show_images",
        images: [
            "/static/picture_dir/12.jpg",
            "/static/picture_dir/2019.jpeg"
           // "/static/picture_dir/1.jpg",
           // "/static/picture_dir/2.jpg",
           // "/static/picture_dir/3.jpg",
           // "/static/picture_dir/4.jpg",
           // "/static/picture_dir/5.jpg",
           // "/static/picture_dir/6.jpg",
           // "/static/picture_dir/7.jpg",
           // "/static/picture_dir/8.jpg",
           // "/static/picture_dir/9.jpg",
           // "/static/picture_dir/10.jpg",
           // "/static/picture_dir/11.jpg"
        ],
        interval: 5000,
        delay: 3000,
        x_count: 6,
        y_count: 7,
        x_y_scale: 1.57 / 2
    });
});
