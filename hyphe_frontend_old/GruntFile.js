module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower_concat: {
		  all: {
		    dest: 'app/js/_bower.js',
			  exclude: [
	        'html5-boilerplate'
		    ]

		  }
		}
  });

	grunt.loadNpmTasks('grunt-bower-concat');

  // Default task(s).
  grunt.registerTask('default', ['bower_concat']);
  
}