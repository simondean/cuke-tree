var fs = require("fs"), $f = require("fluid"),
	handlebars = require("handlebars");

var internal = require("../../cukeTree.internal.js");
var handlebarsHelpers = require("./generators/handlebarsHelpers.js");


module.exports = function(extOptions) {
	return function(context, callback) {		
		context.on("init", function(options, callback) {
			this.renderData = this.renderData ? this.renderData : {};				
			callback();
		});
		
		context.on("prepareData", function(options, callback) {
			var self = this;
			$f(fs)({name:"results"}).readFile(options.input)
			.with(require("./generators/structureGenerator.js"))({name : "structureJson"}).generate(options)
			.with(require("./generators/summaryGenerator.js"))({name : "summaryJson"}).generate(options)
			.with(require("./generators/glossaryGenerator.js"))({name : "glossaryReport"}).generate(options)
			.with(require("./generators/stepsGenerator.js"))({name : "stepsReport"}).generate(options)
			.go(function(err, res) {
				if (err) {callback(err);} else {
					self.renderData = {
						structure : res.structureJson[0],
						summary : res.summaryJson[0],
						glossary : res.glossaryReport[0].glossaryJson,
						stepFiles : res.stepsReport[0]
					}
					callback();
				}
			});
		});
		
		context.on("loadTemplates", function(options, callback) {
			var self = this;
			this.templates = internal.templates.loader.mergeTemplateCollections([self.loadedExtensions.templates, options.templates]);
			callback();
		});
		
		context.on("render", function(options, callback) {
			var self = this;
			internal.templates.loader.compileTemplateCollection(this.templates, handlebars, function(err, compiledTemplates) {
				self.compiledTemplates = compiledTemplates;
				if (err) {callback(err);} else {
					handlebarsHelpers.register(handlebars);
					self.rendered = {
						page : compiledTemplates.page(self.renderData),
						report : self.renderData.structure ? compiledTemplates.report(self.renderData.structure) : null,
						summary : self.renderData.structure ? compiledTemplates.summary(self.renderData) : null,
						scenarios : self.renderData.structure ? compiledTemplates.scenarios(self.renderData.structure) : null,
						steps : self.renderData.structure ? compiledTemplates.steps(self.renderData) : null
					};
					self.data = self.rendered; //needs refactoring so reads from rendered
					self.glossaryJson = self.renderData.glossary; //needs refactoring so reads from rendered
					callback();
				}
			});
		});
		
		callback();
	};
};