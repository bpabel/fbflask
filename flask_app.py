
# A very simple Flask Hello World app for you to get started with...

import requests

from flask import Flask, request, url_for, render_template


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('layout.html')


@app.route('/privacy/')
def privacy():
	return render_template('privacy.html')
	

if __name__ == '__main__':
    app.run()
