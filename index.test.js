"use strict";

const vows = require('vows');
const assert = require('assert');
const { Remarkable } = require('remarkable');

const plugin = require('./index.js');

const md = new Remarkable({
  html: true,
  breaks: true
});
md.use(plugin);

vows.describe('MermaidPlugin').addBatch({

}).export(module);
