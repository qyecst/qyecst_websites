# -*- coding: utf-8 -*-
import os
import re
import json
import math
import mistune
from flask import Blueprint, render_template, current_app, request, jsonify, abort
from module.config import BASE_DIR
from module.model import Summary, Post, MistuneRenderer

# 创建路由对象
router = Blueprint("router", __name__)

# 运行需要的信息
SUMMARY = None


# 文章更新
def reload_posts(summary_obj):
    try:
        # 文章查找路径
        post_dir = current_app.config.get("USER_POST_DIR")
        # urls map
        post_url_file = current_app.config.get("USER_URL_FILE")
        post_urls = None
        with open(post_url_file, "r", encoding="utf8") as f:
            post_urls = json.loads(f.read())
        if not post_urls:
            raise Exception('urls.json not found')
        # 获取基础路径 /basic_url/render_path，浏览器使用，故替换为"/"
        basic_url = (post_dir.replace(BASE_DIR, "") + os.path.sep).replace(os.path.sep, "/")
        # 新文章信息
        new_post_dict = dict()
        # 当前目录深度
        root_path_deep = len(post_dir.split(os.path.sep))
        # markdown渲染器
        user_render = MistuneRenderer(basic_url=basic_url)
        # markdown生成器
        md_generator = mistune.Markdown(renderer=user_render)
        # 遍历目录
        for root, dirs, files in os.walk(post_dir):
            # 只遍历当前目录，忽略子目录
            if len(root.split(os.path.sep)) > root_path_deep:
                break
            for file in files:
                # 区分.md文件
                if os.path.splitext(file)[1] == ".md":
                    with open(os.path.join(root, file), "r", encoding="utf8") as f:
                        all_str = f.read()
                    # 获取信息json对象 .group()返回匹配此正则表达式的字符串
                    info = json.loads(re.search("{(.*\n)*?}", all_str).group())
                    # 下述post初始化
                    new_post = Post()
                    #new_post.filename = file.replace(".md", "")  # 文件名，用于id
                    if post_urls.get(file):
                        new_post.filename = post_urls.get(file)
                    else:
                        raise Exception('urls map fail')
                    new_post.title = info.get("title")  # 文章标题
                    new_post.create = info.get("create")  # 创建时间
                    new_post.modify = info.get("modify")  # 修改时间
                    new_post.category = info.get("category")  # 文章分类
                    new_post.tag_list = info.get("tag")  # 标签列表
                    # 浏览数
                    # if RUN_OBJ.view_info.get(new_post.filename):  # 获取浏览数
                    #     new_post.view = RUN_OBJ.view_info.get(new_post.filename)
                    # else:  # 不存在则初始化
                    #     new_post.view = 0
                    #     RUN_OBJ.view_info[new_post.filename] = 0  # 追加入全局信息
                    new_post.view = 0  # 浏览数
                    new_post.info_list = info.get("info")  # 附加信息列表
                    user_render.reset_toc()  # 重置toc
                    new_post.content = md_generator.parse(all_str)  # 内容
                    new_post.toc = user_render.generate_toc()  # table of content
                    #new_post.preview = md_generator.parse(all_str.split('[preview]: # (end preview)')[0])  # 预览
                    new_post.preview = ''
                    # 加入新文章信息
                    new_post_dict[new_post.filename] = new_post
        # 按创建时间反向排序，大的在前
        #sorted_post_list = sorted(new_post_dict.values(), key=lambda ele: ele.create, reverse=True)
        sorted_post_list = sorted(new_post_dict.values(), key=lambda ele: ele.filename)
        # post添加前后post
        for i in range(len(sorted_post_list)):
            if i > 0:
                new_post_dict[sorted_post_list[i].filename].prev_post = new_post_dict[sorted_post_list[i - 1].filename]  # 前一篇post
            if i < len(sorted_post_list) - 1:
                new_post_dict[sorted_post_list[i].filename].next_post = new_post_dict[sorted_post_list[i + 1].filename]  # 后一篇post
        # 对象信息更新
        summary_obj.post_dict = new_post_dict
        # 返回操作结果
        return True
    except Exception as e:
        current_app.my_logger.error(e)
        return False


# 一言更新
def reload_hitokoto(summary_obj):
    try:
        # 一言文件位置
        hitokoto_file = current_app.config.get("USER_HITOKOTO_FILE")
        # 读取数据
        with open(hitokoto_file, "r", encoding="utf8") as f:
            info_str = f.read()
        # 转为json对象
        info = json.loads(info_str)
        # 全局对象信息更新
        summary_obj.hitokoto_list = info.get("hitokoto_lists")
        # 返回操作结果
        return True
    except Exception as e:
        current_app.my_logger.error(e)
        return False


# 分类更新
def reload_category(summary_obj):
    try:
        # 临时信息列表
        tmp_list = list()
        # 遍历所有分类
        for po in summary_obj.post_dict.values():
            tmp_list.append(po.category)
        # 去重
        tmp_set = set(tmp_list)
        # 最终信息
        new_list = list()
        # 计数
        for ele in tmp_set:
            new_list.append("{0}({1})".format(ele, tmp_list.count(ele)))
        # 全局对象信息更新
        summary_obj.category_list = new_list
        # 返回操作结果
        return True
    except Exception as e:
        current_app.my_logger.error(e)
        return False


# 标签更新
def reload_tag(summary_obj):
    try:
        # 临时信息列表
        tmp_list = list()
        # 遍历所有标签
        for po in summary_obj.post_dict.values():
            tmp_list.extend(po.tag_list)
        # 计数
        cnt_dit=dict()
        for ele in tmp_list:
          if cnt_dit.get(ele):
            cnt_dit[ele] = cnt_dit[ele] + 1
          else:
            cnt_dit[ele] = 1
        cnt_list=sorted(cnt_dit.items(), key=lambda d: d[1], reverse=True)
        new_list = list()
        # 计数
        for ele,cnt in cnt_list:
            new_list.append("{0}({1})".format(ele, cnt))
        # 全局对象信息更新
        summary_obj.tag_list = new_list[:30]
        # 返回操作结果
        return True
    except Exception as e:
        current_app.my_logger.error(e)
        return False


# 初始化函数
def init_func():
    try:
        # 全局对象
        global SUMMARY
        # 临时对象
        summary = Summary()
        # 所有更新都成功才更新已有信息
        if reload_posts(summary) and reload_hitokoto(summary) and reload_category(summary) and reload_tag(summary):
            SUMMARY = summary
        else:  # 否则不更新
            current_app.my_logger.error("信息更新失败")
    except Exception as e:
        current_app.my_logger.error(e)


# Flask-APScheduler定时任务
def scheduler_func():
    from app import app
    with app.app_context():  # app上下文
        init_func()  # 信息更新函数
        current_app.my_logger.info("定时任务执行成功")  # 日志记录


# 第一次request前初始化
@router.before_app_first_request
def app_first_init():
    init_func()  # 初始化函数
    current_app.my_logger.info("before_app_first_request:第一次request前初始化")


# 首页
@router.route("/")
def index():
    global SUMMARY
    is_ajax = request.args.get("is_ajax", None)
    page_item = current_app.config.get("USER_PAGE_ITEM")
    max_page = math.ceil(len(SUMMARY.post_dict) / page_item)
    cur_page = 1
    if is_ajax:
        res = {"title": None, "html": render_template("zone_main.html", content_type="preview", post_list=sorted(SUMMARY.post_dict.values(), key=lambda ele: ele.filename)[:page_item], current_page=cur_page, max_page=max_page,
                                                      post=None,
                                                      search_result=None, keytype=None, keyword=None, search_current=None, search_max=None)}
        return jsonify(res)
    return render_template("index.html",
                           zone_title=render_template("zone_title.html", title=None),
                           zone_hitokoto=render_template("zone_hitokoto.html", hitokoto=SUMMARY.get_random_hitokoto()),
                           zone_main=render_template("zone_main.html", content_type="preview", post_list=sorted(SUMMARY.post_dict.values(), key=lambda ele: ele.filename)[:page_item], current_page=cur_page, max_page=max_page,
                                                     post=None,
                                                     search_result=None, keytype=None, keyword=None, search_current=None, search_max=None),
                           zone_toc=render_template("zone_toc.html", post_toc=None),
                           zone_sticker=render_template("zone_sticker.html", all_tag=SUMMARY.tag_list, all_category=SUMMARY.category_list),
                           zone_scripts=render_template("zone_scripts.html", funcs_name=None))


# 浏览
@router.route("/page_<int:page_num>.html")
def page(page_num):
    global SUMMARY
    is_ajax = request.args.get("is_ajax", None)
    page_item = current_app.config.get("USER_PAGE_ITEM")
    max_page = math.ceil(len(SUMMARY.post_dict) / page_item)
    cur_page = page_num if page_num <= max_page else 1
    if is_ajax:
        res = {"title": None, "html": render_template("zone_main.html", content_type="preview", post_list=sorted(SUMMARY.post_dict.values(), key=lambda ele: ele.filename)[page_item * (cur_page - 1):page_item * cur_page], current_page=cur_page, max_page=max_page,
                                                      post=None,
                                                      search_result=None, keytype=None, keyword=None, search_current=None, search_max=None)}
        return jsonify(res)
    return render_template("index.html",
                           zone_title=render_template("zone_title.html", title=None),
                           zone_hitokoto=render_template("zone_hitokoto.html", hitokoto=SUMMARY.get_random_hitokoto()),
                           zone_main=render_template("zone_main.html", content_type="preview", post_list=sorted(SUMMARY.post_dict.values(), key=lambda ele: ele.filename)[page_item * (cur_page - 1):page_item * cur_page], current_page=cur_page, max_page=max_page,
                                                     post=None,
                                                     search_result=None, keytype=None, keyword=None, search_current=None, search_max=None),
                           zone_toc=render_template("zone_toc.html", post_toc=None),
                           zone_sticker=render_template("zone_sticker.html", all_tag=SUMMARY.tag_list, all_category=SUMMARY.category_list),
                           zone_scripts=render_template("zone_scripts.html", funcs_name=None))


# 阅读
@router.route("/post/<string:filename>.html")
def post(filename):
    global SUMMARY
    is_ajax = request.args.get("is_ajax", None)
    po = SUMMARY.get_post_by_filename(filename)
    if not po:
        abort(404)
    if is_ajax:
        res = {"title": po.title,
               "html": render_template("zone_main.html", content_type="post", post_list=None, current_page=None, max_page=None,
                                       post=po,
                                       search_result=None, keytype=None, keyword=None, search_current=None, search_max=None),
               "toc": render_template("zone_toc.html", post_toc=po.toc)}
        return jsonify(res)
    return render_template("index.html",
                           zone_title=render_template("zone_title.html", title=po.title),
                           zone_hitokoto=render_template("zone_hitokoto.html", hitokoto=SUMMARY.get_random_hitokoto()),
                           zone_main=render_template("zone_main.html", content_type="post", post_list=None, current_page=None, max_page=None,
                                                     post=po,
                                                     search_result=None, keytype=None, keyword=None, search_current=None, search_max=None),
                           zone_toc=render_template("zone_toc.html", post_toc=po.toc),
                           zone_sticker=render_template("zone_sticker.html", all_tag=SUMMARY.tag_list, all_category=SUMMARY.category_list),
                           zone_scripts=render_template("zone_scripts.html", funcs_name=None))


# 关于
@router.route("/about.html")
def about():
    global SUMMARY
    is_ajax = request.args.get("is_ajax", None)
    if is_ajax:
        res = {"title": "关于", "html": render_template("zone_main.html", content_type="about", post_list=None, current_page=None, max_page=None,
                                                      post=None,
                                                      search_result=None, keytype=None, keyword=None, search_current=None, search_max=None)}
        return jsonify(res)
    return render_template("index.html",
                           zone_title=render_template("zone_title.html", title="关于"),
                           zone_hitokoto=render_template("zone_hitokoto.html", hitokoto=SUMMARY.get_random_hitokoto()),
                           zone_main=render_template("zone_main.html", content_type="about", post_list=None, current_page=None, max_page=None,
                                                     post=None,
                                                     search_result=None, keytype=None, keyword=None, search_current=None, search_max=None),
                           zone_toc=render_template("zone_toc.html", post_toc=None),
                           zone_sticker=render_template("zone_sticker.html", all_tag=SUMMARY.tag_list, all_category=SUMMARY.category_list),
                           zone_scripts=render_template("zone_scripts.html", funcs_name=None))


# 搜索
@router.route("/search.html")
def search():
    global SUMMARY
    is_ajax = request.args.get("is_ajax", None)
    keyword = request.args.get("keyword", "")
    keytype = request.args.get("keytype", "")
    page_num = request.args.get("page_num", 1, type=int)
    result_list = list()
    if "title" in keytype:
        for po in SUMMARY.post_dict.values():
            if keyword.lower() in po.title.lower():  # 不区分大小写
                result_list.append(po)
    if "tag" in keytype:
        for po in SUMMARY.post_dict.values():
            if keyword in po.tag_list:  # 精确匹配
                result_list.append(po)
    if "category" in keytype:
        for po in SUMMARY.post_dict.values():
            if keyword in po.category:  # 精确匹配
                result_list.append(po)
    # 结果按创建时间排序，大在前
    result_list.sort(key=lambda ele: ele.create, reverse=True)
    page_item = current_app.config.get("USER_PAGE_ITEM")
    max_page = math.ceil(len(result_list) / page_item)
    cur_page = page_num if page_num <= max_page else 1
    if is_ajax:
        res = {"title": "{0}:{1}".format(keytype, keyword), "html": render_template("zone_main.html", content_type="search", post_list=None, current_page=None, max_page=None,
                                                                                    post=None,
                                                                                    search_result=result_list[page_item * (cur_page - 1):page_item * cur_page], keytype=keytype, keyword=keyword, search_current=cur_page, search_max=max_page)}
        return jsonify(res)
    return render_template("index.html",
                           zone_title=render_template("zone_title.html", title="{0}:{1}".format(keytype, keyword)),
                           zone_hitokoto=render_template("zone_hitokoto.html", hitokoto=SUMMARY.get_random_hitokoto()),
                           zone_main=render_template("zone_main.html", content_type="search", post_list=None, current_page=None, max_page=None,
                                                     post=None,
                                                     search_result=result_list[page_item * (cur_page - 1):page_item * cur_page], keytype=keytype, keyword=keyword, search_current=cur_page, search_max=max_page),
                           zone_toc=render_template("zone_toc.html", post_toc=None),
                           zone_sticker=render_template("zone_sticker.html", all_tag=SUMMARY.tag_list, all_category=SUMMARY.category_list),
                           zone_scripts=render_template("zone_scripts.html", funcs_name=None))


# 一言
@router.route("/hitokoto.html")
def hitokoto():
    global SUMMARY
    return jsonify(SUMMARY.get_random_hitokoto() or {"hitokoto": "暂无一言信息", "where": "qyecst", "create": "qyecst"})


# 错误路由绑定
@router.app_errorhandler(404)
@router.app_errorhandler(500)
def err404(e):
    is_ajax = request.args.get("is_ajax")
    if is_ajax:
        res = {"title": "错误:{0}".format(e.code if e.code else 500), "html": render_template("zone_error.html", err_code=e.code if e.code else 500, err_desc=e.description)}
        return jsonify(res)
    return render_template("index.html",
                           zone_title=render_template("zone_title.html", title="错误:{0}".format(e.code)),
                           zone_hitokoto=render_template("zone_hitokoto.html", hitokoto=SUMMARY.get_random_hitokoto()),
                           zone_main=render_template("zone_error.html", err_code=e.code, err_desc=e.description),
                           zone_toc=render_template("zone_toc.html", post_toc=None),
                           zone_sticker=render_template("zone_sticker.html", all_tag=SUMMARY.tag_list, all_category=SUMMARY.category_list),
                           zone_scripts=render_template("zone_scripts.html", funcs_name=None))
