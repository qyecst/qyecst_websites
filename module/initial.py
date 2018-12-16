# -*- coding: utf-8 -*-
from flask import Flask
from flask_apscheduler import APScheduler
from module.config import BASE_DIR, Config, get_time_str
from module.logger import my_logger

# APScheduler
scheduler = APScheduler()


# create app object
def create_app():
    # app初始化，设定root path为根目录
    app = Flask(__name__, root_path=BASE_DIR)
    # 配置初始化
    app.config.from_object(Config)
    # jinja自定义过滤器
    app.jinja_env.filters["get_time_str"] = get_time_str
    # logger初始化
    app.my_logger = my_logger
    # APScheduler初始化
    scheduler.init_app(app)
    scheduler.start()
    # 路由注册
    from module.router import router
    app.register_blueprint(router)
    # 返回app对象
    return app


# 创建app对象
app_obj = create_app()
