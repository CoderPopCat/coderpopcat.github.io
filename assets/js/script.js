const lenis = new Lenis();
window.lenis = lenis;

lenis.on("scroll", ScrollTrigger.update);

function raf(time) {
	lenis.raf(time);
	requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

document.addEventListener("click", (e) => {
	const link = e.target.closest('a[href^="#"]');
	if (!link || link.getAttribute("href") === "#") return;
	const target = document.querySelector(link.getAttribute("href"));
	if (!target) return;
	e.preventDefault();
	lenis.scrollTo(target, { duration: 1.5 });
});

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

CustomEase.create("counterEase", "M0,0 C0.126,0.382 0.108,0.691 0.266,0.839 0.458,1.019 0.818,1.001 1,1 ");

let _playHeroAnims = null;
let _loaderExited = false;

function tryPlayHero() {
	if (_playHeroAnims && _loaderExited) _playHeroAnims();
}

const otherProjects = [
	{
		name: "Pop Cat Wrapper",
		type: "NPM Package",
		project: "https://www.npmjs.com/package/popcat-wrapper",
		label: "Node.js wrapper for the Pop Cat API",
		img: "/assets/img/mockups/wrapper/1.png"
	},
	{
		name: "Todo List",
		type: "Web App",
		project: "https://popcat.xyz/todo",
		label: "Task manager with local & cloud storage",
		img: "/assets/img/mockups/todo/1.png"
	},
	{
		name: "Country Searcher",
		type: "Web App",
		project: "https://countries.popcat.xyz",
		label: "Country info & distance calculator between nations",
		img: "/assets/img/mockups/country/1.png"
	}
]

document.addEventListener("DOMContentLoaded", () => {
	document.fonts.ready.then(init);
	(async () => {
		const response = await fetch('https://cdn.popcat.xyz/update');
		const res = await response.json();
		const { count } = res;
		const views = document.querySelector("#views");
		views.innerText = count.toLocaleString();
	})();
});

function init() {
	const canvas = document.getElementById("glCanvas");
	const gl = canvas.getContext("webgl");
	if (!gl) { console.error("WebGL not supported"); return; }

	const startTime = 90;
	let resLoc = null;

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const isLowPower = window.innerWidth <= 768 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
	const RES_SCALE = isLowPower ? 0.5 : 1;

	function resize() {
		canvas.width = Math.round(window.innerWidth * RES_SCALE);
		canvas.height = Math.round(window.innerHeight * RES_SCALE);
		gl.viewport(0, 0, canvas.width, canvas.height);
		if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height);
	}

	const VS = `
		attribute vec2 pos;
		void main() { gl_Position = vec4(pos, 0.0, 1.0); }
	`;

	const FS = `
		precision mediump float;
		uniform float uTime;
		uniform vec2  uRes;

		float hash(vec2 p) {
			return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
		}

		float noise(vec2 p) {
			vec2 i = floor(p), f = fract(p);
			vec2 u = f * f * (3.0 - 2.0 * f);
			return mix(
				mix(hash(i), hash(i+vec2(1,0)), u.x),
				mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y
			);
		}

		float fbm(vec2 p) {
			float v = 0.0, a = 0.5;
			mat2 m = mat2(0.8,-0.6,0.6,0.8);
			for (int i = 0; i < 8; i++) {
				v += a * noise(p);
				p  = m * p * 2.05 + vec2(1.7, 9.2);
				a *= 0.5;
			}
			return v;
		}

		void main() {
			vec2 uv = gl_FragCoord.xy / uRes;
			uv.y = 1.0 - uv.y;

			float t = uTime * 0.02;

			vec2 q = vec2(fbm(uv*2.0 + t), fbm(uv*2.0 + vec2(5.2,1.3) + t));
			vec2 r = vec2(
				fbm(uv*2.0 + q + vec2(1.7,9.2) + t*0.75),
				fbm(uv*2.0 + q + vec2(8.3,2.8) + t*0.75)
			);
			float f = fbm(uv*1.8 + r + t*0.5);
			f = clamp(f, 0.0, 1.0);
			f = pow(f, 1.6);

			float cx  = uv.x - 0.5;
			float colW = exp(-cx * cx * 3.5);
			float topB = exp(-uv.y * uv.y * 1.8);
			float mask = clamp(colW * topB * 2.2, 0.0, 1.0);

			float ambient = fbm(uv * 1.5 + t * 0.3) * 0.18;
			float lit = clamp(f * mask + ambient, 0.0, 1.0);

			vec3 c0 = vec3(0.000, 0.000, 0.000);
			vec3 c1 = vec3(0.000, 0.080, 0.085);
			vec3 c2 = vec3(0.005, 0.200, 0.190);
			vec3 c3 = vec3(0.030, 0.420, 0.370);

			vec3 col = mix(c0, c1, clamp(lit*2.0,     0.0, 1.0));
			     col = mix(col, c2, clamp(lit*3.0-0.6, 0.0, 1.0));
			     col = mix(col, c3, clamp(lit*4.5-2.0, 0.0, 1.0));

			gl_FragColor = vec4(col, 1.0);
		}
	`;

	function mkShader(type, src) {
		const s = gl.createShader(type);
		gl.shaderSource(s, src);
		gl.compileShader(s);
		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
		return s;
	}

	const prog = gl.createProgram();
	gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS));
	gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
	gl.linkProgram(prog);
	gl.useProgram(prog);

	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

	const posLoc = gl.getAttribLocation(prog, "pos");
	gl.enableVertexAttribArray(posLoc);
	gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

	const timeLoc = gl.getUniformLocation(prog, "uTime");
	resLoc = gl.getUniformLocation(prog, "uRes");

	window.addEventListener("resize", resize);
	resize();

	let _rafId = null;
	let _canvasVisible = true;

	const _canvasObserver = new IntersectionObserver(([entry]) => {
		_canvasVisible = entry.isIntersecting;
		if (_canvasVisible && !_rafId) {
			_rafId = requestAnimationFrame(draw);
		}
	}, { threshold: 0 });
	_canvasObserver.observe(canvas);

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) return;
		if (_canvasVisible && !_rafId) _rafId = requestAnimationFrame(draw);
	});

	const t0 = performance.now();
	const FRAME_INTERVAL = isLowPower ? 1000 / 30 : 0;
	let _lastFrameTime = 0;

	function draw(now) {
		_rafId = null;
		if (!_canvasVisible || document.hidden) return;

		if (FRAME_INTERVAL && now - _lastFrameTime < FRAME_INTERVAL) {
			_rafId = requestAnimationFrame(draw);
			return;
		}
		_lastFrameTime = now;

		const elapsed = (performance.now() - t0) / 1000 + startTime;
		gl.uniform1f(timeLoc, elapsed);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		if (reduceMotion) return;
		_rafId = requestAnimationFrame(draw);
	}
	_rafId = requestAnimationFrame(draw);

	function startLoader(onComplete) {
		const counterValue = document.getElementById("loaderCounterValue");
		const counterWrap = document.getElementById("loaderCounter");
		const counter = { val: 0 };

		const tl = gsap.timeline();

		tl.to(counter, {
			val: 100,
			duration: 2,
			ease: "counterEase",
			onUpdate() {
				counterValue.textContent = String(Math.round(counter.val)).padStart(2, "0");
			}
		})
			.to(counterWrap, {
				opacity: 0,
				y: -20,
				duration: 0.6,
				ease: "counterEase"
			}, "-=0.15")
			.call(onComplete, null, "<");
	}

	startLoader(() => {
		gsap.to(".bar", {
			duration: 1,
			height: 0,
			stagger: { amount: 0.15 },
			ease: "power4.inOut",
			onUpdate() {
				if (!_loaderExited && this.progress() >= 0.5) {
					_loaderExited = true;
					tryPlayHero();
				}
			}
		});
	});


	const heroSplits = [];
	let heroPSplit = null;

	document.querySelectorAll(".animate-text").forEach((el) => {
		if (el.classList.contains("hero-actions-nav")) return;
		if (el.tagName === "H1") return;
		if (el.closest(".stat-row")) return;
		if (el.closest(".other-projects")) return;
		if (el.closest(".testimonials-section")) return;

		let customDuration;
		const attr = el.getAttribute("data-anim-duration");
		if (attr) customDuration = parseFloat(attr);

		gsap.set(el, { opacity: 1 });

		const split = SplitText.create(el, {
			type: "lines,words",
			mask: "lines",
			linesClass: "line++",
			wordsClass: "word++"
		});
		gsap.set(split.words, { y: "110%" });

		if (el.classList.contains("hero-p")) {
			heroPSplit = split;
		} else if (el.closest(".hero")) {
			heroSplits.push(split);
		} else {
			ScrollTrigger.create({
				trigger: el,
				start: "top 88%",
				invalidateOnRefresh: true,
				onEnter: () => {
					gsap.killTweensOf(split.words);
					gsap.to(split.words, { y: "0%", duration: customDuration || 1.4, stagger: 0.04, ease: "expo.out" });
				},
				onLeaveBack: () => {
					gsap.killTweensOf(split.words);
					gsap.to(split.words, { y: "110%", duration: 0.4, stagger: 0.02, ease: "expo.in" });
				}
			});
		}
	});

	document.querySelectorAll(".animate-line").forEach((el) => {
		if (el.closest(".stat-row")) return;
		if (el.closest(".testimonials-section")) return;
		const attr = el.getAttribute("data-anim-duration");
		const dur = attr ? parseFloat(attr) : 1.4;

		gsap.set(el, { opacity: 1 });

		const split = SplitText.create(el, {
			type: "lines,words",
			mask: "lines",
			linesClass: "line++"
		});

		const lines = split.lines;
		gsap.set(lines, { y: "110%" });

		ScrollTrigger.create({
			trigger: el,
			start: "top 88%",
			invalidateOnRefresh: true,
			onEnter: () => {
				gsap.killTweensOf(lines);
				gsap.to(lines, { y: "0%", duration: dur, stagger: 0.1, ease: "expo.out" });
			},
			onLeaveBack: () => {
				gsap.killTweensOf(lines);
				gsap.to(lines, { y: "110%", duration: 0.4, stagger: 0.05, ease: "expo.in" });
			}
		});
	});

	const allHeroWords = heroSplits.flatMap(s => s.words);

	let heroZeroChars = null;
	let heroTwoChars = null;
	const heroH1 = document.querySelector(".hero h1");
	if (heroH1) {
		gsap.set(heroH1, { opacity: 1 });
		const h1Split = SplitText.create(heroH1, { type: "lines,words,chars", mask: "lines" });
		gsap.set(h1Split.chars, { y: "110%" });
		if (h1Split.words[0]) heroZeroChars = Array.from(h1Split.words[0].children).reverse();
		if (h1Split.words[1]) heroTwoChars = Array.from(h1Split.words[1].children);
	}

	let navChars = null;
	const navEl = document.querySelector(".hero-actions-nav");
	if (navEl) {
		gsap.set(navEl, { opacity: 1 });
		const navSplit = SplitText.create(navEl, { type: "chars" });
		gsap.set(navSplit.chars, { opacity: 0, y: 8 });
		navChars = navSplit.chars;
	}

	gsap.set(".hero-actions button", { opacity: 0, x: -24 });
	gsap.set(".socials .icon", { opacity: 0, x: -20 });


	_playHeroAnims = () => {
		if (heroZeroChars) {
			gsap.to(heroZeroChars, { y: "0%", duration: 1.6, stagger: 0.088, ease: "expo.out" });
		}
		if (heroTwoChars) {
			gsap.to(heroTwoChars, { y: "0%", duration: 1.8, stagger: 0.088, ease: "expo.out" });
		}

		if (heroPSplit) {
			gsap.to(heroPSplit.words, { y: "0%", duration: 2.0, stagger: 0.04, ease: "expo.out" });
		}

		gsap.fromTo(".hero-divider",
			{ width: "0%" },
			{ width: "100%", duration: 1.8, ease: "expo.out", delay: 0.45 }
		);

		gsap.to(".hero-actions button", { opacity: 1, x: 0, duration: 1.0, ease: "expo.out", delay: 0.55 });

		if (navChars) {
			gsap.to(navChars, { opacity: 1, y: 0, duration: 0.7, stagger: 0.022, ease: "expo.out", delay: 0.65 });
		}

		gsap.to(".socials .icon", { opacity: 1, x: 0, duration: 1.0, stagger: 0.13, ease: "expo.out", delay: 0.95 });
	};

	tryPlayHero();


	gsap.fromTo(".about-reveal-section",
		{ y: "15vh" },
		{
			y: "-15vh",
			ease: "none",
			scrollTrigger: {
				trigger: ".about-reveal-section",
				start: "top bottom",
				end: "top top",
				scrub: 1.5,
			}
		}
	);


	const aboutRevealEl = document.querySelector(".about-reveal-text");
	if (aboutRevealEl) {
		const raw = aboutRevealEl.textContent.trim();
		aboutRevealEl.innerHTML = raw.split(/\s+/).map(w => `<span class="a-word">${w}</span>`).join(" ");

		const wordEls = [...aboutRevealEl.querySelectorAll(".a-word")];
		gsap.set(wordEls, { opacity: 0, filter: "blur(6px)", color: "#ffffff" });

		const isMobileReveal = window.innerWidth <= 800;
		const wordStagger = isMobileReveal ? 0.02 : 0.14;
		const wordDuration = isMobileReveal ? 0.1 : 0.4;

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: aboutRevealEl,
				start: "top bottom",
				end: "bottom center",
				scrub: 1,
			}
		});

		wordEls.forEach((el, i) => {
			tl.to(el, { opacity: 1, filter: "blur(0px)", duration: wordDuration, ease: "none" }, i * wordStagger);
		});
	}

	document.querySelectorAll(".stat-row").forEach((row) => {
		const num = row.querySelector(".stat-row-number");
		const titleEl = row.querySelector(".stat-row-title");
		const descEl = row.querySelector(".stat-row-desc");

		const numMask = document.createElement("div");
		numMask.style.cssText = "overflow:hidden; display:inline-block;";
		num.parentNode.insertBefore(numMask, num);
		numMask.appendChild(num);
		gsap.set(num, { y: "110%" });

		gsap.set(titleEl, { opacity: 1 });
		const titleSplit = SplitText.create(titleEl, {
			type: "lines,words",
			mask: "lines",
			linesClass: "line++",
			wordsClass: "word++"
		});
		gsap.set(titleSplit.words, { y: "110%" });

		gsap.set(descEl, { opacity: 1 });
		const descSplit = SplitText.create(descEl, {
			type: "lines,words",
			mask: "lines",
			linesClass: "line++"
		});
		gsap.set(descSplit.lines, { y: "110%" });

		ScrollTrigger.create({
			trigger: row,
			start: "top bottom",
			onEnter: () => {
				gsap.killTweensOf(num);
				gsap.to(num, { y: "0%", duration: 1.4, ease: "expo.out" });
				gsap.killTweensOf(titleSplit.words);
				gsap.to(titleSplit.words, { y: "0%", duration: 1.4, stagger: 0.04, ease: "expo.out" });
				gsap.killTweensOf(descSplit.lines);
				gsap.to(descSplit.lines, { y: "0%", duration: 1.4, stagger: 0.1, ease: "expo.out", delay: 0.2 });
			},
			onLeaveBack: () => {
				gsap.killTweensOf(num);
				gsap.to(num, { y: "110%", duration: 0.4, ease: "expo.in" });
				gsap.killTweensOf(titleSplit.words);
				gsap.to(titleSplit.words, { y: "110%", duration: 0.4, stagger: 0.02, ease: "expo.in" });
				gsap.killTweensOf(descSplit.lines);
				gsap.to(descSplit.lines, { y: "110%", duration: 0.4, stagger: 0.05, ease: "expo.in" });
			}
		});
	});

	document.querySelectorAll(".stat-divider").forEach(el => {
		gsap.set(el, { scaleX: 0, transformOrigin: "left center" });
		ScrollTrigger.create({
			trigger: el,
			start: "top 92%",
			onEnter: () => gsap.to(el, { scaleX: 1, duration: 1.4, ease: "expo.out" }),
			onLeaveBack: () => gsap.set(el, { scaleX: 0 })
		});
	});

	const marqueeTrack = document.getElementById("marqueeTrack");

	if (marqueeTrack) {
		let mX = 0;
		let mDir = 1;
		let mDirTarget = 1;
		let mBaseSpeed = 1;
		let mVelBoost = 0;
		let halfW = 0;

		requestAnimationFrame(() => requestAnimationFrame(() => {
			halfW = marqueeTrack.scrollWidth / 2;
		}));

		lenis.on("scroll", ({ velocity }) => {
			const v = velocity || 0;
			if (Math.abs(v) > 0.05) {
				mDirTarget = v > 0 ? 1 : -1;
				mVelBoost = Math.min(Math.abs(v) * 0.25, 9);
			}
		});

		gsap.ticker.add(() => {
			if (halfW === 0) return;

			mDir += (mDirTarget - mDir) * 0.05;

			const isRTL = mDir > 0.08;
			const newAttr = isRTL ? "ltr" : "rtl";
			if (marqueeTrack.dataset.direction !== newAttr) {
				marqueeTrack.dataset.direction = newAttr;
			}

			mVelBoost *= 0.93;
			const speed = mBaseSpeed + mVelBoost;

			mX += mDir * speed;

			if (mX <= -halfW) mX += halfW;
			if (mX >= 0) mX -= halfW;

			marqueeTrack.style.transform = `translateX(${mX}px)`;
		});
	}

	const projectsIntro = document.querySelector(".projects-intro");
	if (projectsIntro) {
		const heading = projectsIntro.querySelector(".projects-heading");
		const desc = projectsIntro.querySelector(".projects-desc");

		gsap.set(desc, { opacity: 1, clipPath: "inset(0 0 100% 0)" });
		const descSplit = SplitText.create(desc, {
			type: "lines,words",
			mask: "lines",
			linesClass: "line++"
		});
		gsap.set(descSplit.lines, { y: "110%" });

		const centerY = window.innerHeight * 0.35 - heading.offsetHeight * 0.5 - 48;
		gsap.set(heading, { y: centerY });

		gsap.to(heading, {
			y: 0,
			fontSize: "4.6rem",
			ease: "none",
			scrollTrigger: {
				trigger: projectsIntro,
				start: "top top",
				end: "40% top",
				scrub: 1,
			}
		});

		const hideDesc = () => {
			gsap.killTweensOf(descSplit.lines);
			gsap.set(descSplit.lines, { y: "110%" });
			gsap.set(desc, { clipPath: "inset(0 0 100% 0)" });
		};

		ScrollTrigger.create({
			trigger: projectsIntro,
			start: "52% top",
			end: "bottom top",
			onEnter: () => {
				gsap.set(desc, { clipPath: "inset(0 0 0% 0)" });
				gsap.killTweensOf(descSplit.lines);
				gsap.to(descSplit.lines, { y: "0%", duration: 1.4, stagger: 0.1, ease: "expo.out" });
			},
			onLeave: hideDesc,
			onLeaveBack: hideDesc,
		});

		const projectsShowcase = document.querySelector(".projects-showcase");
		if (projectsShowcase) {
			const scIndexEl = projectsShowcase.querySelector("#projectIndexEl");
			const scNamesEl = projectsShowcase.querySelector("#projectNames");
			const scCards = Array.from(projectsShowcase.querySelectorAll(".project-content"));

			gsap.set(scIndexEl, { opacity: 0 });
			gsap.set(scNamesEl, { opacity: 0 });
			gsap.set(scCards, { clipPath: "inset(0 0 100% 0)" });

			const showcaseTl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
				.to(scIndexEl, { opacity: 1, duration: 0.9 })
				.to(scCards, { clipPath: "inset(0 0 0% 0)", duration: 1.2, stagger: 0.07 }, "-=0.4")
				.to(scNamesEl, { opacity: 1, duration: 1.0 }, "<");

			ScrollTrigger.create({
				trigger: projectsIntro,
				start: "52% top",
				onEnter: () => showcaseTl.play(),
				onLeaveBack: () => showcaseTl.reverse(),
			});
		}
	}

	const projectsSticky = document.getElementById("projectsSticky");
	const projectIndexEl = document.getElementById("projectIndexEl");
	const projectIndexH1 = document.getElementById("projectIndexH1");
	const projectImagesEl = document.getElementById("projectImages");
	const projectNamesEl = document.getElementById("projectNames");
	const worksProgressBar = document.getElementById("worksProgressBar");

	if (projectsSticky && projectImagesEl) {
		const nameEls = Array.from(projectNamesEl.querySelectorAll("p"));
		const TOTAL = nameEls.length;

		const cards = Array.from(projectImagesEl.querySelectorAll(".project-content"));

		function getMetrics() {
			const sectionH = projectsSticky.offsetHeight;
			const sectionPad = parseFloat(getComputedStyle(projectsSticky).paddingTop) || 0;
			const indexH = projectIndexEl.offsetHeight;
			const namesH = projectNamesEl.offsetHeight;
			const imagesH = projectImagesEl.scrollHeight;
			const winH = window.innerHeight;
			const noSidebar = window.innerWidth <= 1000;
			const imagesTargetFactor = noSidebar ? 1 : 0.7;

			return {
				moveDistanceIndex: sectionH - sectionPad * 2 - indexH,
				moveDistanceNames: sectionH - sectionPad * 2 - namesH,
				moveDistanceImages: Math.min(winH - imagesH, -(imagesH - winH * imagesTargetFactor)),
			};
		}

		ScrollTrigger.create({
			trigger: projectsSticky,
			start: "top top",
			end: () => `+=${window.innerHeight * TOTAL * 0.9}px`,
			pin: true,
			pinSpacing: true,
			scrub: 1,
			onEnter: () => { if (worksProgressBar) worksProgressBar.style.opacity = "1"; },
			onEnterBack: () => { if (worksProgressBar) worksProgressBar.style.opacity = "1"; },
			onLeave: () => { if (worksProgressBar) worksProgressBar.style.opacity = "0"; },
			onLeaveBack: () => {
				if (worksProgressBar) {
					worksProgressBar.style.opacity = "0";
					worksProgressBar.style.width = "0%";
				}
			},
			onUpdate(self) {
				const progress = self.progress;
				const { moveDistanceIndex, moveDistanceNames, moveDistanceImages } = getMetrics();

				if (worksProgressBar) worksProgressBar.style.width = (progress * 100) + "%";

				const currentIndex = Math.min(Math.floor(progress * TOTAL) + 1, TOTAL);
				projectIndexH1.innerHTML =
					String(currentIndex).padStart(2, "0") +
					`<span class="index-total">/${String(TOTAL).padStart(2, "0")}</span>`;
				gsap.set(projectIndexEl, { y: progress * moveDistanceIndex });

				gsap.set(projectImagesEl, { y: progress * moveDistanceImages });

				const activeIndex = Math.min(Math.floor(progress * TOTAL), TOTAL - 1);
				nameEls.forEach((p, i) => {
					const startP = i / TOTAL;
					const endP = (i + 1) / TOTAL;
					const pp = Math.max(0, Math.min(1, (progress - startP) / (endP - startP)));
					gsap.set(p, { y: -pp * moveDistanceNames });
					p.classList.toggle("active", pp > 0 && pp < 1);
				});
				cards.forEach((card, i) => {
					gsap.to(card, { opacity: i === activeIndex ? 1 : 0.3, duration: 0.4, overwrite: "auto", ease: "none" });
				});
			},
		});
	}

	const awardsListContainer = document.querySelector(".op-list");
	const awardPreview = document.querySelector(".op-preview");
	const awardsList = document.querySelector(".op-list");

	if (!awardsListContainer || !awardPreview) return;

	gsap.set(awardPreview, { x: -9999, y: -9999 });

	const POSITIONS = {
		BOTTOM: 0,
		MIDDLE: -100,
		TOP: -200,
	};

	let lastMousePosition = { x: 0, y: 0 };
	let activeAward = null;
	let ticking = false;
	let mouseTimeout = null;
	let isMouseMoving = false;

	otherProjects.forEach((award, index) => {
		const awardElement = document.createElement("div");
		awardElement.className = "op-row";
		const idx = `(${String(index + 1).padStart(2, "0")})`;

		awardElement.innerHTML = `
			<div class="op-wrapper">
				<div class="op-dark">
					<span class="op-index">${idx}</span>
					<h1>${award.name}</h1>
					<span class="op-type">${award.type}</span>
				</div>
				<div class="op-light">
					<span class="op-index">${idx}</span>
					<h1>${award.name} <span class="op-arrow">&#8599;</span></h1>
					<span class="op-desc">${award.label}</span>
				</div>
				<div class="op-dark">
					<span class="op-index">${idx}</span>
					<h1>${award.name}</h1>
					<span class="op-type">${award.type}</span>
				</div>
			</div>
		`;

		awardElement.style.cursor = "pointer";
		awardElement.addEventListener("click", () => {
			window.open(award.project, "_blank", "noopener,noreferrer");
		});

		awardsListContainer.appendChild(awardElement);
	});
	const awardsElements = document.querySelectorAll(".op-row");
	const animatePreview = () => {
		const awardsListRect = awardsList.getBoundingClientRect();

		if (
			lastMousePosition.x < awardsListRect.left ||
			lastMousePosition.x > awardsListRect.right ||
			lastMousePosition.y < awardsListRect.top ||
			lastMousePosition.y > awardsListRect.bottom
		) {
			const previewImages = awardPreview.querySelectorAll("img");
			previewImages.forEach((img) => {
				gsap.to(img, {
					scale: 0,
					duration: 0.4,
					ease: "power2.out",
					onComplete: () => img.remove(),
				});
			});
			gsap.to(awardPreview, { opacity: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
		}
	};

	const updateAwards = () => {
		animatePreview();

		if (activeAward) {
			const rect = activeAward.getBoundingClientRect();
			const isStillOver =
				lastMousePosition.x >= rect.left &&
				lastMousePosition.x <= rect.right &&
				lastMousePosition.y >= rect.top &&
				lastMousePosition.y <= rect.bottom;

			if (!isStillOver) {
				const wrapper = activeAward.querySelector(".op-wrapper");
				const leavingFromTop = lastMousePosition.y < rect.top + rect.height / 2;

				gsap.to(wrapper, {
					y: leavingFromTop ? POSITIONS.TOP : POSITIONS.BOTTOM,
					duration: 0.4,
					ease: "power2.out",
					overwrite: true,
				});
				activeAward = null;
			}
		}
		awardsElements.forEach((award, index) => {
			if (award === activeAward) return;

			const rect = award.getBoundingClientRect();
			const isMouseOver =
				lastMousePosition.x >= rect.left &&
				lastMousePosition.x <= rect.right &&
				lastMousePosition.y >= rect.top &&
				lastMousePosition.y <= rect.bottom;

			if (isMouseOver) {
				const wrapper = award.querySelector(".op-wrapper");
				const enterFromTop = lastMousePosition.y < rect.top + rect.height / 2;

				gsap.to(wrapper, {
					y: POSITIONS.MIDDLE,
					duration: 0.4,
					ease: "power2.out",
					overwrite: true,
				});
				activeAward = award;
			}
		});

		ticking = false;
	};

	document.addEventListener("mousemove", (e) => {
		lastMousePosition.x = e.clientX;
		lastMousePosition.y = e.clientY;

		const pw = awardPreview.offsetWidth;
		const ph = awardPreview.offsetHeight;
		const gap = 24;
		let px = e.clientX + gap;
		let py = e.clientY + gap;
		if (px + pw + 10 > window.innerWidth) px = e.clientX - pw - gap;
		if (py + ph + 10 > window.innerHeight) py = e.clientY - ph - gap;
		gsap.to(awardPreview, { x: px, y: py, duration: 0.55, ease: "power3.out", overwrite: "auto" });

		isMouseMoving = true;
		if (mouseTimeout) {
			clearTimeout(mouseTimeout)
		}

		const awardsListRect = awardsList.getBoundingClientRect();
		const isInsideAwardsList = lastMousePosition.x >= awardsListRect.left && lastMousePosition.x <= awardsListRect.right && lastMousePosition.y >= awardsListRect.top && lastMousePosition.y <= awardsListRect.bottom;

		if (isInsideAwardsList) {
			mouseTimeout = setTimeout(() => {
				isMouseMoving = false;
				const images = awardPreview.querySelectorAll("img");
				if (images.length > 1) {
					const lastImage = images[images.length - 1];
					images.forEach((img) => {
						if (img !== lastImage) {
							gsap.to(img, {
								scale: 0,
								duration: 0.4,
								ease: "power2.out",
								onComplete: () => img.remove(),
							});
						}
					});
				}
			}, 2000);
		}

		animatePreview();
	});

	document.addEventListener(
		"scroll",
		() => {
			if (!ticking) {
				requestAnimationFrame(() => {
					updateAwards();
				});
				ticking = true;
			}
		},
		{ passive: true }
	);

	awardsElements.forEach((award, index) => {
		const wrapper = award.querySelector(".op-wrapper");
		let currentPosition = POSITIONS.TOP;

		award.addEventListener("mouseenter", (e) => {
			activeAward = award;
			const rect = award.getBoundingClientRect();
			const enterFromTop = e.clientY < rect.top + rect.height / 2;

			if (enterFromTop || currentPosition === POSITIONS.BOTTOM) {
				currentPosition = POSITIONS.MIDDLE;
				gsap.to(wrapper, {
					y: POSITIONS.MIDDLE,
					duration: 0.4,
					ease: "power2.out",
					overwrite: true,
				});
			}

			gsap.to(awardPreview, { opacity: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });

			const img = document.createElement("img");
			img.src = otherProjects[index].img || `https://picsum.photos/id/${index}/400/225`;
			img.style.scale = 0;
			img.style.zIndex = Date.now();

			awardPreview.appendChild(img);

			gsap.to(img, {
				scale: 1,
				duration: 0.4,
				ease: "power2.out",
			});
		});

		award.addEventListener("mouseleave", (e) => {
			activeAward = null;
			const rect = award.getBoundingClientRect();
			const leavingFromTop = e.clientY < rect.top + rect.height / 2;

			currentPosition = leavingFromTop ? POSITIONS.TOP : POSITIONS.BOTTOM;
			gsap.to(wrapper, {
				y: currentPosition,
				duration: 0.4,
				ease: "power2.out",
				overwrite: true,
			});
		});
	});

	ScrollTrigger.refresh();

	document.querySelectorAll(".other-projects .animate-text").forEach((el) => {
		gsap.set(el, { opacity: 1 });
		const split = SplitText.create(el, {
			type: "lines,words",
			mask: "lines",
			linesClass: "line++",
			wordsClass: "word++"
		});
		gsap.set(split.words, { y: "110%" });
		ScrollTrigger.create({
			trigger: el,
			start: "top 88%",
			onEnter: () => {
				gsap.killTweensOf(split.words);
				gsap.to(split.words, { y: "0%", duration: 1.4, stagger: 0.04, ease: "expo.out" });
			},
			onLeaveBack: () => {
				gsap.killTweensOf(split.words);
				gsap.to(split.words, { y: "110%", duration: 0.4, stagger: 0.02, ease: "expo.in" });
			}
		});
	});

	const testimonialsSection = document.getElementById("testimonialsSection");
	if (testimonialsSection) {
		const tQuoteEl = document.getElementById("testimonialQuote");
		const tNameEl = document.getElementById("testimonialName");
		const tRoleEl = document.getElementById("testimonialRole");
		const tAvatarEl = document.getElementById("testimonialAvatar");
		const tCounterEl = document.getElementById("testimonialCounter");
		const tPrevBtn = document.getElementById("testimonialPrev");
		const tNextBtn = document.getElementById("testimonialNext");
		const tProgressEl = document.getElementById("testimonialProgress");
		const TOTAL_T = testimonials.length;
		const AUTOPLAY_MS = 6000;

		const tFills = testimonials.map(() => {
			const seg = document.createElement("span");
			seg.className = "t-progress-seg";
			const fill = document.createElement("span");
			fill.className = "t-progress-fill";
			seg.appendChild(fill);
			tProgressEl.appendChild(seg);
			return fill;
		});

		let activeTestimonial = 0;
		let playToken = 0;
		let autoplayTimeout = null;

		const makeLineReveal = (el, opts = {}) => {
			let split = null;
			return (text) => {
				if (split) split.revert();
				el.textContent = text;
				gsap.set(el, { opacity: 1 });
				split = SplitText.create(el, { type: "lines,words", mask: "lines", linesClass: "line++" });
				gsap.killTweensOf(split.lines);
				gsap.set(split.lines, { y: "110%" });
				gsap.to(split.lines, {
					y: "0%",
					duration: opts.duration || 1.2,
					stagger: opts.stagger || 0.08,
					delay: opts.delay || 0,
					ease: "expo.out"
				});
			};
		};

		const makeWordReveal = (el, opts = {}) => {
			let split = null;
			return (text) => {
				if (split) split.revert();
				el.textContent = text;
				gsap.set(el, { opacity: 1 });
				split = SplitText.create(el, { type: "lines,words", mask: "lines", linesClass: "line++", wordsClass: "word++" });
				gsap.killTweensOf(split.words);
				gsap.set(split.words, { y: "110%" });
				gsap.to(split.words, {
					y: "0%",
					duration: opts.duration || 1.4,
					stagger: opts.stagger || 0.04,
					delay: opts.delay || 0,
					ease: "expo.out"
				});
			};
		};

		const playQuoteReveal = makeLineReveal(tQuoteEl, { duration: 1.2, stagger: 0.08 });
		const playNameReveal = makeWordReveal(tNameEl, { duration: 0.9, stagger: 0.05, delay: 0.08 });
		const playRoleReveal = makeWordReveal(tRoleEl, { duration: 0.9, stagger: 0.05, delay: 0.14 });

		const initialsOf = (name) => (name || "").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
		const AVATAR_COLORS = ["#11dbc0", "#e4e4e7"];

		const goToTestimonial = (i) => {
			playToken++;
			const token = playToken;
			activeTestimonial = ((i % TOTAL_T) + TOTAL_T) % TOTAL_T;
			const item = testimonials[activeTestimonial];

			playQuoteReveal(item.quote);
			playNameReveal(item.name);
			playRoleReveal(item.role);
			tAvatarEl.textContent = item.avatar || initialsOf(item.name);
			tAvatarEl.style.background = item.avatarBg || AVATAR_COLORS[activeTestimonial % AVATAR_COLORS.length];
			tCounterEl.textContent = `${String(activeTestimonial + 1).padStart(2, "0")}/${String(TOTAL_T).padStart(2, "0")}`;

			tFills.forEach((fill, idx) => {
				fill.style.transition = "none";
				fill.style.width = idx < activeTestimonial ? "100%" : "0%";
			});

			const activeFill = tFills[activeTestimonial];
			void activeFill.offsetWidth;
			activeFill.style.transition = `width ${AUTOPLAY_MS}ms linear`;
			requestAnimationFrame(() => {
				if (token !== playToken) return;
				activeFill.style.width = "100%";
			});

			clearTimeout(autoplayTimeout);
			autoplayTimeout = setTimeout(() => {
				if (token !== playToken) return;
				goToTestimonial(activeTestimonial + 1);
			}, AUTOPLAY_MS);
		};

		if (tPrevBtn) tPrevBtn.addEventListener("click", () => goToTestimonial(activeTestimonial - 1));
		if (tNextBtn) tNextBtn.addEventListener("click", () => goToTestimonial(activeTestimonial + 1));

		goToTestimonial(0);

		const tMM = gsap.matchMedia();

		const tServiceItems = Array.from(testimonialsSection.querySelectorAll(".testimonials-col .t-stack-item"));
		const setActiveService = (i) => {
			tServiceItems.forEach((it, idx) => {
				it.classList.toggle("is-active", idx === i);
				it.dataset.dist = Math.min(Math.abs(idx - i), 3);
			});
		};

		tMM.add("(min-width: 1001px)", () => {
			const itemTriggers = tServiceItems.map((item, i) => ScrollTrigger.create({
				trigger: item,
				start: "top center",
				end: "bottom center",
				onToggle: self => { if (self.isActive) setActiveService(i); }
			}));

			return () => itemTriggers.forEach(t => t.kill());
		});

		tMM.add("(max-width: 1000px)", () => {
			const itemTriggers = tServiceItems.map((item, i) => ScrollTrigger.create({
				trigger: item,
				start: "top 65%",
				end: "bottom 35%",
				onToggle: self => { if (self.isActive) setActiveService(i); }
			}));

			return () => itemTriggers.forEach(t => t.kill());
		});

		ScrollTrigger.refresh();

		testimonialsSection.querySelectorAll(".t-stack-label.animate-text").forEach((el) => {
			gsap.set(el, { opacity: 1 });
			const split = SplitText.create(el, {
				type: "lines,words",
				mask: "lines",
				linesClass: "line++",
				wordsClass: "word++"
			});
			gsap.set(split.words, { y: "110%" });
			ScrollTrigger.create({
				trigger: el,
				start: "top 88%",
				invalidateOnRefresh: true,
				onEnter: () => {
					gsap.killTweensOf(split.words);
					gsap.to(split.words, { y: "0%", duration: 1.4, stagger: 0.04, ease: "expo.out" });
				},
				onLeaveBack: () => {
					gsap.killTweensOf(split.words);
					gsap.to(split.words, { y: "110%", duration: 0.4, stagger: 0.02, ease: "expo.in" });
				}
			});
		});
	}

	const footerContainer = document.querySelector(".sf-container");
	if (footerContainer) {
		ScrollTrigger.create({
			trigger: "footer",
			start: "top bottom",
			end: "bottom bottom",
			scrub: true,
			onUpdate: (self) => {
				const { progress } = self;
				const yValue = -35 * (1 - progress);
				gsap.set(footerContainer, { y: `${yValue}%` });
			}
		});
	}

}
