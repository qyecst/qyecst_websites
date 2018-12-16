# -*- coding: utf-8 -*-
import os
import time
import json
import logging
from logging.handlers import RotatingFileHandler
from module.config import BASE_DIR

# 所有参数 ["name", "msg", "args", "levelname", "levelno", "pathname", "filename", "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName", "created", "msecs", "relativeCreated", "thread", "threadName", "processName", "process"]
attr_record = ["created", "levelname", "msg", "name", "filename", "lineno", "module", "funcName", "args"]


# json格式formatter
class JsonFormatter:
    @staticmethod
    def format(record):
        obj = {attr: getattr(record, attr) for attr in attr_record}
        obj["created"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(obj["created"]))  # 转换成localtime再转换成新的时间格式(XXXX-XX-XX XX:XX:XX)
        return json.dumps(obj, ensure_ascii=False)


# 另一个formatter
# formatter = logging.Formatter("TIME:%(asctime)s+++NAME:%(name)s+++LV:%(levelname)s+++MOD:%(module)s+++FUNC:%(funcName)s+++LINE:%(lineno)d+++MSG:%(message)s")

# rotating_file_handler设置
file_name = os.path.join(BASE_DIR, "site.v4.log")
rotating_file_handler = RotatingFileHandler(filename=file_name, mode="a", maxBytes=10 * 1024 * 1024, backupCount=5, encoding="UTF-8")
rotating_file_handler.setFormatter(JsonFormatter)

# logger设置
my_logger = logging.getLogger("site.v4")
my_logger.addHandler(rotating_file_handler)
my_logger.setLevel(logging.INFO)
