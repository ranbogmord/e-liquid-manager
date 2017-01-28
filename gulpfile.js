const gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  browserify = require('browserify'),
  babelify = require('babelify'),
  source = require('vinyl-source-stream'),
  path = require('path'),
  es = require('event-stream');

gulp.task('js', () => {
  let srcFiles = [
    'public/src/app.js'
  ];

  return es.merge.apply(null, srcFiles.map(file => {
    return browserify(file)
    .transform('babelify', {presets: ["es2015"]})
    .bundle()
    .pipe(source(path.basename(file)))
    .pipe(gulp.dest('public/assets/js/dist'));
  }));
});

gulp.task('watch', () => {
  gulp.watch('public/src/**/*.js', ['js']);
});

gulp.task('default', ['js', 'watch']);
