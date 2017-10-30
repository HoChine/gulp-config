const gulp = require('gulp');
const changed = require('gulp-changed');
const htmlmin = require('gulp-htmlmin');
const sass = require('gulp-sass');
const autofx = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const runSequence = require('run-sequence'); // 设定同步异步执行任务
const md5 = require('gulp-md5-assets');
const concat = require('gulp-concat');
const del = require('del');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const config = require('./.gulp.config');
// 转移 html
gulp.task('move-html', () => {
	return gulp
		.src('./src/**/*.html')
		.pipe(changed('./dev'))
		.pipe(gulp.dest('./dev'));
})

// 压缩 html
gulp.task('minify-html', ['move-html'], () => {
	return gulp
		.src('./dev/**/*.html')
		.pipe(htmlmin(config.htmlmin))
		.pipe(gulp.dest('./dist'))
		.pipe(md5(10));
})

// 编译 sass
gulp.task('sass', () => {
	return gulp
		.src('./src/styles/**/*.scss')
		.pipe(sass({
			outputStyle: 'expanded'
		}).on('error', sass.logError))
		.pipe(autofx(config.autofx))
		.pipe(gulp.dest('./dev/styles'))
		.pipe(reload({
			stream: true
		}));
})

// 压缩 css
gulp.task('minify-css', ['sass'], () => {
	return gulp
		.src('./dev/styles/**/*.css')
		.pipe(cleanCSS(config.cleanCSS))
		.pipe(gulp.dest('./dist/styles'))
		.pipe(md5(10, './dist/**/*.html'));
})

// 编译 js
gulp.task('babel-js', () => {
	return gulp
		.src('./src/scripts/**/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(changed('./dev/scripts'))
		.pipe(babel({
			presets: ['es2015', 'stage-0'],
			plugins: ['transform-decorators-legacy']
		}))
		.pipe(gulp.dest('./dev/scripts'))
		.pipe(reload({
			stream: true
		}));
})

// 压缩js
gulp.task('minify-js', ['babel-js'], () => {
	return gulp
		.src('./dev/scripts/**/*.js')
		.pipe(uglify(config.uglify))
		.pipe(gulp.dest('./dist/scripts'))
		.pipe(md5(10, './dist/**/*.html'));
})

// 转移图片
gulp.task('move-img', () => {
	return gulp
		.src('./src/images/**/*.{png,jpg,gif,ico}')
		.pipe(changed('./dev/images'))
		.pipe(gulp.dest('./dev/images'))
		.pipe(reload({
			stream: true
		}));
})

// 转移图片（不压缩）
gulp.task('minify-img', ['move-img'], () => {
	return gulp
		.src('./dev/images/**/*.{png,jpg,gif,ico}')
		.pipe(cache(imagemin({
			progressive: true,
			optimizationLevel: 5
		})))
		.pipe(gulp.dest('./dist/images'))
		.pipe(md5(10, './dist/**/*.{css,js,html,json}'));
})

// json 转移
gulp.task('move-json', () => {
	return gulp
		.src('./src/_data/*.json')
		.pipe(gulp.dest('./dev/_data'))
		.pipe(reload({
			stream: true
		}));
})

// json 转移至 build
gulp.task('build-json', () => {
	return gulp
		.src('./src/_data/*.json')
		.pipe(gulp.dest('./dist/_data'))
		.pipe(md5(10, './dist/**/*.js'));
})

// 转移 libs 插件
gulp.task('move-libs-dev', () => {
	return gulp.src('./src/libs/**/*')
		.pipe(gulp.dest('./dev/libs'));
})

gulp.task('move-libs-build', () => {
	return gulp.src('./src/libs/**/*')
		.pipe(gulp.dest('./dist/libs'))
		.pipe(md5(10, './dist/**/*.html'))
})

// 清空文件
gulp.task('clean-dev', (cb) => {
	return del(['./dev/**/*'], cb);
})

gulp.task('clean-build', (cb) => {
	return del(['./dist/**/*'], cb);
})

// 命令行命令
// 编译
gulp.task('dev', (cb) => {
	runSequence('clean-dev', 'move-html', [
		'sass', 'babel-js', 'move-libs-dev'
	], 'move-img', 'move-json', cb)
})

// 测试执行
gulp.task('run', () => {
	browserSync.init({
		server: {
			baseDir: './dev'
		},
		open: 'external',
		injectChanges: true
	});

	gulp.watch('./src/styles/**/*.scss', ['sass']);
	gulp.watch('./src/scripts/**/*.js', ['babel-js']);
	gulp.watch('./src/images/**/*.{png,jpg,gif,ico}', ['move-img']);
	gulp.watch('./src/_data/*.json', ['move-json']);
	gulp.watch('./src/**/*.html', ['move-html']).on('change', reload);
})

// 压缩输出
gulp.task('build', (cb) => {
	runSequence('clean-build', 'minify-html', [
		'minify-css', 'minify-js', 'move-libs-build'
	], 'minify-img', 'build-json', cb)
})

// 生产版本测试
gulp.task('build-test', ['build'], () => {
	browserSync.init({
		server: {
			baseDir: './build'
		},
		open: 'external'
	});
})