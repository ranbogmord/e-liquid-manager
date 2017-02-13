const gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  browserify = require('browserify'),
  babelify = require('babelify'),
  source = require('vinyl-source-stream'),
  path = require('path'),
  es = require('event-stream'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer');

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

gulp.task('styles', () => {
  const baseFileDir = "public/assets/css";
  let srcFiles = [
    "admin",
    "login",
    "style",
    "user"
  ].map(f => `${baseFileDir}/${f}.scss`);

  es.merge.apply(null, srcFiles.map(file => {
    return gulp.src(file)
      .pipe(sass.sync().on('error', sass.logError))
      .pipe(autoprefixer({
        browsers: ['last 2 versions', 'ios >= 6'],
        cascade: false
      }))
      .pipe(gulp.dest(baseFileDir));
  }));
});

gulp.task('watch', () => {
  gulp.watch('public/src/**/*.js', ['js']);
  gulp.watch('public/assets/css/**/*.scss', ['styles']);
});

gulp.task('default', ['js', 'styles', 'watch']);
