module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-shell');
	grunt.initConfig({

		// Import package manifest
		pkg: grunt.file.readJSON("package.json"),

		// Banner definitions
		meta: {
			banner: "/*\n" +
				" *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
				" *  <%= pkg.description %>\n" +
				" *  <%= pkg.homepage %>\n" +
				" *\n" +
				" *  Made by <%= pkg.author.name %>\n" +
				" *  Under <%= pkg.license %> License\n" +
				" */\n"
		},

		// Concat definitions
		concat: {
			options: {
				banner: "<%= meta.banner %>"
			},
			dist: {
				src: ["src/jquery.parsetable.js"],
				dest: "dist/jquery.parsetable.js"
			}
		},

		// Lint definitions
		jshint: {
			files: ["src/jquery.parsetable.js"],
			options: {
				jshintrc: ".jshintrc"
			}
		},

		// Minify definitions
		uglify: {
			my_target: {
				src: ["dist/jquery.parsetable.js"],
				dest: "dist/jquery.parsetable.min.js"
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},
        
        // Generate JSDoc documentation
        shell: {
            build_docs: {
                command: "./node_modules/.bin/jsdoc src/jquery.parsetable.js -p -R src/README.md -d docs"
            }
        },

		// watch for changes to source
		// Better than calling grunt a million times
		// (call 'grunt watch')
		watch: {
		    files: ['src/*'],
		    tasks: ['default']
		}

	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-coffee");
	grunt.loadNpmTasks("grunt-contrib-watch");

	grunt.registerTask("build", ["concat", "uglify", "shell"]);
	grunt.registerTask("default", ["jshint", "build"]);
	grunt.registerTask("travis", ["default"]);

};
