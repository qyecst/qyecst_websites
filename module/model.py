# -*- coding: utf-8 -*-
import random
import mistune
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import html


# 文章
class Post:
    # 文件名，用于id (String
    filename = None
    # 文章标题 (String
    title = None
    # 创建时间 (String
    create = None
    # 修改时间 (String
    modify = None
    # 文章分类 (String
    category = None
    # 标签列表 (List(String)
    tag_list = None
    # 浏览数 (Integer
    view = None
    # 附加信息列表 (List(String)
    info_list = None
    # 内容 (String
    content = None
    # table of content (String
    toc = None
    # 预览 (String
    preview = None
    # 上一篇 (Post
    prev_post = None
    # 下一篇 (Post
    next_post = None


# 综合信息
class Summary:
    # 文章列表 (List(Post)
    post_dict = None
    # 一言列表 (List(JSON-obj)
    hitokoto_list = None
    # 分类列表 (List(String)
    category_list = None
    # 标签列表 (List(String)
    tag_list = None

    # 返回随机一言 return:(JSON-obj or (None
    def get_random_hitokoto(self):
        if self.hitokoto_list and len(self.hitokoto_list) > 0:
            return self.hitokoto_list[random.randrange(0, len(self.hitokoto_list))]
        else:
            return None

    # 返回指定文章 return:(Post or (None
    def get_post_by_filename(self, filename):
        if self.post_dict and filename in self.post_dict.keys():
            return self.post_dict.get(filename)
        else:
            return None


# markdown渲染
class MistuneRenderer(mistune.Renderer):
    # toc列表 List(Tuple(id, level, text)))
    toc_tree = None
    # toc计数 id="toc-{count}"
    toc_count = None
    # toc层级
    toc_level = None
    # 基础路径
    basic_url = None

    # 初始化
    def __init__(self, basic_url=None, toc_level=6, **kwargs):
        super().__init__(**kwargs)
        self.basic_url = basic_url
        self.toc_count = 0
        self.toc_tree = list()
        self.toc_level = toc_level

    # 块格式代码渲染/高亮
    def block_code(self, code, lang=None):
        if not lang:
            # return '\n<pre><code>{0}</code></pre>\n'.format(mistune.escape(code))
            return '\n<pre><code>{0}</code></pre>\n'.format(mistune.escape(code.strip()))
        try:
            lexer = get_lexer_by_name(lang, stripall=True)
            formatter = html.HtmlFormatter()
            rv = highlight(code, lexer, formatter)
            # return rv
            return '<div class="highlight-wrapper">{0}</div>\n'.format(rv)
        except Exception:
            return '<pre class="{0}"><code>{1}</code></pre>\n'.format(lang, mistune.escape(code))

    # 图片渲染/lightbox2
    def image(self, src, title, text):
        src = mistune.escape_link(src)
        text = mistune.escape(text, quote=True)
        # 自定义基础url
        if self.basic_url:
            new_src = self.basic_url + src
        else:
            new_src = src
        if title:
            title = mistune.escape(title, quote=True)
            img_info = '<a href="{0}" data-lightbox="{2}" data-title="{2}"><img class="img-thumbnail" src="{0}" title={1} alt="{2}"/></a>'.format(new_src, title, text)
            # 如'title=_preview'则不渲染点击加载的图片格式
            if title == "_preview":
                rv = '<div class="text-center">{0}</div>'.format(img_info)
            else:
                rv = "<span class='load_image' data-image_info='{0}'><i class='fa fa-picture-o fa-fw'></i>{1}</span>".format(img_info, text)
        else:
            img_info = '<a href="{0}" data-lightbox="{1}" data-title="{1}"><img class="img-thumbnail" src="{0}" alt="{1}"/></a>'.format(new_src, text)
            rv = "<span class='load_image' data-image_info='{0}'><i class='fa fa-picture-o fa-fw'></i>{1}</span>".format(img_info, text)
        return rv

    # 连接渲染
    def link(self, link, title, text):
        link = mistune.escape_link(link)
        if not title:
            rv = '<a rel="external nofollow noopener noreferrer" target="_blank" href="{0}">{1}</a>'.format(link, text)
        elif title == "_inner_link":
            rv = '<a class="inner_link_mk" href="{0}" title="{1}">{2}</a>'.format(link, title, text)
        else:
            title = mistune.escape(title, quote=True)
            rv = '<a rel="external nofollow noopener noreferrer" target="_blank" href="{0}" title="{1}">{2}</a>'.format(link, title, text)
        return rv

    # 标题渲染/toc
    def header(self, text, level, raw=None):
        rv = '<h{0} id="toc-{1}">{2}</h{0}>\n'.format(level, self.toc_count, text)
        self.toc_tree.append((self.toc_count, text, level))
        self.toc_count += 1
        return rv

    # 重置toc
    def reset_toc(self):
        self.toc_count = 0
        self.toc_tree = list()

    # toc迭代器
    def _iter_toc(self):
        first_lv = 0
        last_lv = 0
        yield '<ul class="right_toc_list">\n'
        for toc in self.toc_tree:
            idx, text, lv = toc
            if lv > self.toc_level:
                # ignore this level
                continue
            if first_lv == 0:
                # based on first level
                first_lv = lv
                last_lv = lv
                yield '<li><a class="text-secondary inner_anchor_mk" href="#toc-{0}">{1}</a></li>\n'.format(idx, text)
            elif lv == last_lv:
                yield '<li><a class="text-secondary inner_anchor_mk" href="#toc-{0}">{1}</a></li>\n'.format(idx, text)
            elif lv == last_lv + 1:
                last_lv = lv
                yield '<li><ul class="right_toc_list">\n<li><a class="text-secondary inner_anchor_mk" href="#toc-{0}">{1}</a></li>'.format(idx, text)
            elif lv < last_lv:
                # close indention
                while lv < last_lv:
                    yield '</ul>\n</li>\n'
                    last_lv -= 1
                yield '<li><a class="text-secondary inner_anchor_mk" href="#toc-{0}">{1}</a></li>'.format(idx, text)
        # close tags
        while last_lv > first_lv:
            yield '</ul>\n</li>\n'
            last_lv -= 1
        yield '</ul>\n'

    # toc生成
    def generate_toc(self):
        return ''.join(self._iter_toc())
