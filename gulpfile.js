var gulp = require('gulp');
var gutil = require('gulp-util');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var streamify = require('gulp-streamify');
var autoprefixer = require('gulp-autoprefixer');
var cssmin = require('gulp-cssmin');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');
var jsonminify = require('gulp-jsonminify');
var connect = require('gulp-connect');
var watch = require('gulp-watch');
var rename = require('gulp-rename');
var zip = require('gulp-zip');

/*
 |--------------------------------------------------------------------------
 | Combine all JS libraries into a single file for fewer HTTP requests.
 |--------------------------------------------------------------------------
 */
gulp.task('createVendorJS', function() {
   return gulp.src([
     'app/components/jquery/dist/jquery.js',
     'app/components/bootstrap/js/dropdown.js',
     'app/components/d3/d3.js',
     'app/components/queue-async/queue.js',
     'app/components/colorbrewer/colorbrewer.js',
     'app/components/spin.js/spin.js',
     'app/components/d3-legend/d3-legend.js',
     'node_modules/d3-save-svg/build/d3-save-svg.js',
   ]).pipe(concat('vendor.js'))
     .pipe(gulp.dest('public/js'))
     .pipe(connect.reload());
 });

gulp.task('createVendorJS-build', function() {
  return gulp.src([
    'app/components/jquery/dist/jquery.js',
    'app/components/bootstrap/js/dropdown.js',
    'app/components/d3/d3.js',
    'app/components/queue-async/queue.js',
    'app/components/colorbrewer/colorbrewer.js',
    'app/components/spin.js/spin.js',
    'app/components/d3-legend/d3-legend.js',
    'node_modules/d3-save-svg/build/d3-save-svg.js',
  ]).pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('public/js'))
    .pipe(connect.reload());
});

gulp.task('createMainJS', function() {
  return gulp.src('app/js/*.js')
    .pipe(concat('main.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(connect.reload());
});

gulp.task('createMainJS-build', function() {
  return gulp.src('app/js/*.js')
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('public/js'));
});

gulp.task('copyCSS', function() {
  return gulp.src([
    'app/components/bootstrap/dist/css/bootstrap.css',
    'app/css/*.css',
  ]).pipe(cssmin())
    .pipe(concat('main.css'))
    .pipe(gulp.dest('public/css'))
    .pipe(connect.reload());
});

gulp.task('minifyCSS', function() {
  return gulp.src([
    'app/components/bootstrap/dist/css/bootstrap.css',
    'app/css/*.css',
  ]).pipe(cssmin())
    .pipe(concat('main.css'))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('public/css'))
    .pipe(connect.reload());
});

gulp.task('compressImages', function() {
  return gulp.src('app/DATA/brainImages/*')
           .pipe(imagemin({
           progressive: true,
           svgoPlugins: [{removeViewBox: false}],
           use: [pngquant()],
         }))
         .pipe(gulp.dest('public/DATA/brainImages'));
});

gulp.task('minifyJSON', function() {
  return gulp.src('app/DATA/*.json')
    .pipe(jsonminify())
    .pipe(gulp.dest('public/DATA'));
});

gulp.task('webserver', function() {
  connect.server({
    port: 8000,
    livereload: true,
    root: ['public', 'app'],
  });
});

gulp.task('watch', function() {
  gulp.watch('app/css/spectra.css', ['copyCSS']);
  gulp.watch('app/js/main.js', ['createMainJS']);
  gulp.watch('app/js/vendor.js', ['createVendorJS']);
});

gulp.task('copyDATA', function() {
  return gulp
    .src('app/DATA/*.json')
    .pipe(gulp.dest('public/DATA'));
});

gulp.task('zip', function() {
  return gulp
    .src(['public/*', 'public/js/*.js', 'public/css/*.css', 'public/fonts/*', '!public/DATA/*.json', './LICENSE.md', './README.md', './SpectraVis-Demo.gif'], {base: '.'})
    .pipe(zip('spectraVis.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('default', ['copyDATA', 'createMainJS', 'createVendorJS', 'copyCSS', 'webserver', 'watch']);
gulp.task('build', ['createMainJS', 'createMainJS', 'createVendorJS', 'copyCSS', 'createMainJS-build', 'createVendorJS-build', 'minifyCSS', 'compressImages', 'minifyJSON']);
