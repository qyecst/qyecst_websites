# -*- coding: utf-8 -*-
from module.initial import app_obj

app = app_obj


# shell注入
@app.shell_context_processor
def make_shell_context():
    return dict(app=app)


if __name__ == "__main__":
    app.run(debug=True)
