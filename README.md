# demo
Interactive demo to visualize Liquid Democracy in action

See Github Issues for discussion -> https://github.com/unitedvote/demo/issues

![screenshot](/screenshot5.png)

## Local development

Development requires 2 shells running in the background:

- One shell should run `npm start`. This will enable `watchify` for `require()` statements in the browser.
- Another shell should run `python -m SimpleHTTPServer`. This will serve the demo at localhost:8000.
