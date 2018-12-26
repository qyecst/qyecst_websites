# -*- coding: utf-8 -*-
import os
from datetime import datetime

# 项目根路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Config:
    # region ======== USER ========
    # 每页显示项目。/**手动调用**/
    USER_PAGE_ITEM = 10
    # md文件目录，只遍历当前目录。/**手动调用**/
    USER_POST_DIR = os.path.join(BASE_DIR, "static", "post_dir")
    # hitokoto文件所在位置。/**手动调用**/
    USER_HITOKOTO_FILE = os.path.join(BASE_DIR, "static", "post_dir", "hitokoto.json")
    # urlmap文件所在位置。/**手动调用**/
    USER_URL_FILE = os.path.join(BASE_DIR, "static", "post_dir", "urls.json")
    # endregion ======== USER ========

    # region ======== FLASK配置 ========
    # 加密字符串。自动注入
    SECRET_KEY = os.urandom(24)
    # JSON转码。自动注入
    JSON_AS_ASCII = True
    # endregion ======== FLASK配置 ========

    # region ======== FLASK-APScheduler配置 ========
    # 配置jobs列表
    JOBS = [  # APScheduler任务
        {
            "id": "scheduler_job",  # id
            "func": "module.router:scheduler_func",  # 执行函数所在位置
            "trigger": "interval",  # 触发方式
            "seconds": 7200  # 间隔
        }
    ]
    # endregion ======== FLASK-APScheduler配置 ========


# 时间格式化函数
def get_time_str(format_type=0):
    now_time = datetime.now()
    if format_type == 1:
        return now_time.strftime("%Y-%m-%d")
    else:
        return now_time.strftime("%Y-%m-%d %H:%M:%S")
