/**
 * fo/scripts/matrix-rain.js - 字母雨动画（独立版）
 *
 * 提取自「墨笈 · 优雅 Markdown 阅读器」scripts/easter-eggs/matrix-rain.js，
 * 动画算法与原版保持一致（尾迹渐变、逐列字符、帧延迟、按 S 退出）。
 *
 * 与原版的差异（解耦 + 独立可用）：
 *  1. 不再依赖 i18n / window.Mojian / showToast / matrixRainState，
 *     改为模块内部自带的迷你 toast 与状态管理；
 *  2. 字符源支持动态文本：默认 data/daodejing.txt，可切换到 data/ 下任意 txt，
 *     加载失败时回退到内置道德经节选；
 *  3. 新增可配置项：字符集（中文文本 / 经典 ASCII）、字号、字体、速度、颜色、全屏开关；
 *  4. 鎏金色（#D4AF37）自动开启金色光晕，字体呈现金光；
 *  5. 新增窗口 resize 自适应与 Esc 退出；
 *  6. 保留 Konami 码彩蛋：↑ ↑ ↓ ↓ ← → ← → B A
 */
(function () {
    'use strict';

    // ===================== 迷你国际化（仅字母雨所需文案） =====================
    const TEXTS = {
        'zh-CN': {
            enter: '🎮 欢迎进入宇宙源码！',
            exit: '已退出宇宙源码模式',
            konami: '🎮 Konami 码生效！欢迎进入宇宙源码！'
        },
        'en-US': {
            enter: '🎮 Welcome to The Cosmic Code!',
            exit: 'Exited Cosmic Code mode',
            konami: '🎮 Konami activated! Welcome to The Cosmic Code!'
        }
    };

    function currentLang() {
        return (navigator.language || 'zh-CN').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
    }
    function t(key) {
        const dict = TEXTS[currentLang()] || TEXTS['zh-CN'];
        return dict[key] || key;
    }

    // ===================== 迷你 Toast =====================
    let toastTimer = null;
    function showToast(message) {
        let el = document.getElementById('matrix-rain-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'matrix-rain-toast';
            el.className = 'mrt-toast';
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            el.classList.remove('show');
        }, 2500);
    }

    // ===================== 状态 =====================
    const state = {
        isRunning: false,
        animationId: null,
        exitHandler: null,
        canvas: null,
        // 可配置项（start 时读取）
        options: {
            charset: 'chinese',     // 'chinese'（中文文本） | 'ascii'（经典 ASCII）
            textSource: 'daodejing.txt', // data/ 目录下的文本文件
            fontSize: 14,
            fontFamily: 'mono',     // 'mono' | 'song' | 'hei' | 'kai' | 'yahei'
            frameDelay: 50,         // 帧间隔毫秒，越小越快
            color: '#0F0',
            fullscreen: true
        }
    };

    // ===================== 字符源 =====================
    const ASCII_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~';

    // 鎏金色：选中时开启金色光晕，让字体呈现金光
    const GOLD_COLOR = '#D4AF37';

    // 字体栈（canvas 渲染用）
    const FONT_STACKS = {
        mono:  '"Courier New", "PingFang SC", "Microsoft YaHei", monospace',
        song:  '"SimSun", "Songti SC", "STSong", serif',
        hei:   '"SimHei", "Heiti SC", "Microsoft YaHei", sans-serif',
        kai:   '"KaiTi", "STKaiti", "Kaiti SC", cursive',
        wenkai: '"LXGW WenKai", "LXGW WenKai Mono", "霞鹜文楷", "Kaiti SC", "KaiTi", cursive',
        zhuque: '"Zhuque Fangsong", "朱雀仿宋", "FangSong", "STFangsong", serif',
        yahei: '"Microsoft YaHei", "PingFang SC", sans-serif'
    };

    // 网络字体（由 styles/fonts.css 经 CDN 提供）：Canvas 绘制前需预热对应分片
    const WEB_FONTS = {
        wenkai: 'LXGW WenKai',
        zhuque: 'Zhuque Fangsong'
    };

    // 内置兜底节选（data 文本加载失败时使用）
    const FALLBACK_DAO =
        '道、可道，非常道。名可名，非常名。无名，天地之始；有名万物之母；故恒无欲，以观其妙；恒有欲，以观其徼。' +
        '此两者，同出而异名，同谓之玄。玄之又玄，众妙之门。天下皆知美之为美，斯恶已。皆知善之为善，斯不善已。' +
        '故有无相生，难易相成，长短相形，高下相盈，音声相和，前后相随。恒也。是以圣人处无为之事，行不言之教；' +
        '万物作而弗始，生而弗有，为而弗恃，功成而不居。夫唯弗居，是以不去。上善若水。水善利万物而不争，' +
        '处众人之所恶，故几于道：居、善地；心、善渊；与、善仁；言、善信；政、善治；事、善能；动、善时；' +
        '夫唯不争，故无尤。持而盈之，不如其已；揣而锐之，不可长保。金玉满堂，莫之能守；富贵而骄，自遗其咎。' +
        '功遂身退，天之道也。五色令人目盲；五音令人耳聋；五味令人口爽；驰骋畋猎，令人心发狂；难得之货，令人行妨。' +
        '是以圣人之治也，为腹不为目，故去彼取此。知人者智，自知者明。胜人者有力，自胜者强。知足者富，强行者有志。' +
        '不失其所者久，死而不亡者寿。为学日益，为道日损。损之又损，以至于无为。无为而无不为。' +
        '取天下常以无事，及其有事，不足以取天下。';

    // 文本缓存：filename -> 清洗后的字符串
    const textCache = {};

    // 加载 data/ 下的文本文件作为字符源
    // 优先级：fetch 真实 txt（服务器部署时数据永远最新）→ 内置道德经节选兜底
    function loadTextSource(filename) {
        if (textCache[filename]) {
            return Promise.resolve(textCache[filename]);
        }
        return fetch('data/' + filename, { cache: 'no-cache' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function (text) {
                const cleaned = text.replace(/\s+/g, '');
                if (cleaned.length < 10) throw new Error('text too short');
                textCache[filename] = cleaned;
                console.log('[matrix-rain] 文本源已加载:', filename, '字符数:', cleaned.length);
                return cleaned;
            })
            .catch(function (err) {

                console.warn('[matrix-rain] 文本加载失败，回退内置道德经节选:', err);
                textCache[filename] = FALLBACK_DAO;
                return FALLBACK_DAO;
            });
    }

    // ===================== 动画变量（模块级，便于 resize 重建） =====================
    let ctx = null;
    let columns = 0;
    let drops = [];
    let charIndices = [];
    let chars = '';

    // ===================== 动画（算法与原版一致） =====================
    function start() {
        if (state.isRunning) return;
        showToast(t('enter'));

        // 全屏：兼容标准 / WebKit / 旧版 IE，失败仅降级（canvas 本身已固定覆盖全视口）
        if (state.options.fullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(function (err) {
                    console.warn('无法进入全屏模式（已降级为视口覆盖）:', err);
                });
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        }

        // 创建画布
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-rain';
        canvas.style.cssText = [
            'position: fixed; top: 0; left: 0; width: 100%; height: 100%;',
            'z-index: 9999; pointer-events: none; background: rgba(0, 0, 0, 0.9);'
        ].join(' ');
        document.body.appendChild(canvas);
        state.canvas = canvas;
        ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // 字符集：中文（动态加载所选文本）或经典 ASCII
        if (state.options.charset === 'chinese') {
            loadTextSource(state.options.textSource).then(function (text) {
                // 异步加载期间用户可能已退出，此时不再启动
                if (!state.isRunning && !state.canvas) return;
                beginAnimation(text);
            });
        } else {
            beginAnimation(ASCII_CHARS);
        }
    }

    function beginAnimation(sourceChars) {
        if (!state.canvas) return;
        chars = sourceChars;
        const useDao = state.options.charset === 'chinese';
        const fontSize = state.options.fontSize;
        const frameDelay = state.options.frameDelay;
        const color = state.options.color;
        const fontStack = FONT_STACKS[state.options.fontFamily] || FONT_STACKS.mono;

        function buildColumns() {
            columns = Math.floor(state.canvas.width / fontSize);
            drops = [];
            charIndices = [];
            for (let i = 0; i < columns; i++) {
                drops[i] = Math.random() * -100;
                if (useDao) {
                    charIndices[i] = Math.floor(Math.random() * chars.length);
                }
            }
        }
        buildColumns();

        state.animationId = null;
        state.isRunning = true;

        function draw() {
            if (!state.isRunning) return;
            // 先清除阴影再绘制背景，避免背景填充产生光晕块
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
            ctx.fillStyle = color;
            // 鎏金色：开启金色光晕，字体呈现金光
            if (color === GOLD_COLOR) {
                ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
                ctx.shadowBlur = 14;
            }
            ctx.font = fontSize + 'px ' + fontStack;

            for (let i = 0; i < drops.length; i++) {
                let text;
                if (useDao) {
                    text = chars[charIndices[i] % chars.length];
                    charIndices[i]++;
                } else {
                    text = chars[Math.floor(Math.random() * chars.length)];
                }
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > state.canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                    if (useDao) {
                        charIndices[i] = Math.floor(Math.random() * chars.length);
                    }
                }
                drops[i]++;
            }

            setTimeout(function () {
                state.animationId = requestAnimationFrame(draw);
            }, frameDelay);
        }

        function stopMatrixRain() {
            if (!state.isRunning) return;
            state.isRunning = false;
            if (state.animationId) {
                cancelAnimationFrame(state.animationId);
                state.animationId = null;
            }

            const exitFullscreen = function () {
                if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(function (err) { console.log('无法退出全屏模式:', err); });
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
            };
            exitFullscreen();

            if (state.exitHandler) {
                document.removeEventListener('keydown', state.exitHandler);
                state.exitHandler = null;
            }

            state.canvas.style.transition = 'opacity 0.5s ease';
            state.canvas.style.opacity = '0';

            setTimeout(function () {
                if (state.canvas) {
                    state.canvas.remove();
                    state.canvas = null;
                }
                showToast(t('exit'));
            }, 500);
        }

        // 按 S / Esc 退出（Esc 为独立版新增）
        state.exitHandler = function (e) {
            if (e.key === 's' || e.key === 'S' || e.key === 'Escape') {
                stopMatrixRain();
                document.removeEventListener('keydown', state.exitHandler);
                state.exitHandler = null;
            }
        };
        document.addEventListener('keydown', state.exitHandler);

        // 网络字体需等待对应分片就绪，否则 Canvas 首帧会回退到系统字体（出现豆腐块）
        const webFont = WEB_FONTS[state.options.fontFamily];
        if (webFont && document.fonts && document.fonts.load) {
            document.fonts.load(fontSize + 'px "' + webFont + '"', chars.slice(0, 1200))
                .catch(function () {})
                .then(function () { draw(); });
        } else {
            draw();
        }
    }

    // 预加载网络字体分片（选字体时调用，返回 Promise）
    function preloadFont(fontFamily) {
        var webFont = WEB_FONTS[fontFamily];
        if (!webFont || !document.fonts || !document.fonts.load) {
            return Promise.resolve();
        }
        var fontSize = state.options.fontSize;
        var sample = (chars && chars.length) ? chars.slice(0, 1200) : FALLBACK_DAO.slice(0, 1200);
        return document.fonts.load(fontSize + 'px "' + webFont + '"', sample).catch(function () {});
    }

    // 判断指定字体族是否为网络字体
    function isWebFont(fontFamily) {
        return !!WEB_FONTS[fontFamily];
    }

    // ===================== 窗口尺寸自适应 =====================
    function handleResize() {
        if (!state.canvas || !state.isRunning) return;
        state.canvas.width = window.innerWidth;
        state.canvas.height = window.innerHeight;
        const fontSize = state.options.fontSize;
        columns = Math.floor(state.canvas.width / fontSize);
        const useDao = state.options.charset === 'chinese';
        // 保持已有列位，不足则补足
        while (drops.length < columns) {
            drops.push(Math.random() * -100);
            if (useDao) {
                charIndices.push(Math.floor(Math.random() * chars.length));
            }
        }
    }

    // ===================== Konami 码彩蛋（保留原版灵魂） =====================
    const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiPos = 0;

    function handleKonami(e) {
        const key = e.key.toLowerCase();
        if (key === KONAMI_CODE[konamiPos].toLowerCase()) {
            konamiPos++;
            if (konamiPos === KONAMI_CODE.length) {
                konamiPos = 0;
                showToast(t('konami'));
                start();
            }
        } else {
            konamiPos = key === KONAMI_CODE[0].toLowerCase() ? 1 : 0;
        }
    }

    // ===================== 对外 API =====================
    function setOptions(partial) {
        Object.keys(partial).forEach(function (k) {
            if (Object.prototype.hasOwnProperty.call(state.options, k)) {
                state.options[k] = partial[k];
            }
        });
    }

    function getOptions() {
        return Object.assign({}, state.options);
    }

    function stop() {
        if (state.exitHandler) {
            state.exitHandler({ key: 'S' });
        }
    }

    // 初始化：挂载监听
    document.addEventListener('keydown', handleKonami);
    window.addEventListener('resize', handleResize);

    window.MatrixRain = {
        start: start,
        stop: stop,
        setOptions: setOptions,
        getOptions: getOptions,
        isRunning: function () { return state.isRunning; },
        loadTextSource: loadTextSource,
        preloadFont: preloadFont,
        isWebFont: isWebFont
    };
})();
