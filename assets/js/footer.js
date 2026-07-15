document.addEventListener("DOMContentLoaded", () => {

	const footerEl = document.querySelector(".site-footer");
	if (!footerEl) return;

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const now = new Date();
	const badgeDateEl = document.getElementById("sfBadgeDate");
	if (badgeDateEl) badgeDateEl.textContent = String(now.getDate()).padStart(2, "0");

	const badgeMonthEl = document.getElementById("sfBadgeMonth");
	if (badgeMonthEl) badgeMonthEl.textContent = now.toLocaleString("en-US", { month: "short" }).toLowerCase();

	const helloBtn = document.getElementById("sfEmail");
const helloTrack = document.getElementById("sfHelloTrack");

if (helloBtn && helloTrack) {
  const HELLO_SPEED = 150;

  const measureHello = () => {
    const copyWidth = helloTrack.children[0].getBoundingClientRect().width;
    helloTrack.style.setProperty("--sf-hello-loop", `${copyWidth}px`);
    helloTrack.style.setProperty("--sf-hello-dur", `${copyWidth / HELLO_SPEED}s`);
  };

  measureHello();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureHello);
  window.addEventListener("resize", () => {
    if (!helloBtn.classList.contains("is-active")) measureHello();
  });

  const setActive = (active) => {
    helloBtn.classList.toggle("is-active", active);
    if (!active) {
      helloTrack.style.animation = "none";
      void helloTrack.offsetWidth;
      helloTrack.style.animation = "";
    }
  };

  helloBtn.addEventListener("mouseenter", () => setActive(true));
  helloBtn.addEventListener("mouseleave", () => setActive(false));
  helloBtn.addEventListener("focus", () => setActive(true));
  helloBtn.addEventListener("blur", () => setActive(false));

  const emailAddr = "sharan.bharta@hotmail.com";
  const staticEl = helloBtn.querySelector(".sf-hello-static");
  let copyTimer = null;

  helloBtn.addEventListener("click", (e) => {
    if (!(navigator.clipboard && navigator.clipboard.writeText)) return;
    e.preventDefault();
    navigator.clipboard.writeText(emailAddr).then(() => {
      setActive(false);
      clearTimeout(copyTimer);
      helloBtn.classList.add("is-copied");
      if (staticEl) staticEl.textContent = "Copied!";
      helloBtn.setAttribute("aria-label", "Email copied to clipboard");
      copyTimer = setTimeout(() => {
        helloBtn.classList.remove("is-copied");
        if (staticEl) staticEl.textContent = "Hire Me";
        helloBtn.setAttribute("aria-label", `Email ${emailAddr}`);
      }, 1600);
    }).catch(() => {
      window.location.href = helloBtn.getAttribute("href");
    });
  });
}
	const clockEl = document.getElementById("sfClock");
	if (clockEl) {
		const timeFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Asia/Dubai",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});

		const tick = () => { clockEl.textContent = timeFormatter.format(new Date()); };
		tick();
		setInterval(tick, 60000);
	}

	const splineContainer = document.getElementById("spline-container");

	if (!reduceMotion) {
		if (splineContainer) {
			gsap.fromTo(splineContainer,
				{ y: "-8%" },
				{
					y: "8%",
					ease: "none",
					scrollTrigger: {
						trigger: footerEl,
						start: "top bottom",
						end: "bottom top",
						scrub: true,
					}
				}
			);
		}
	}

	const canvas = document.getElementById("footerCanvas3d");
	if (!canvas) return;

	const isLowPower = window.innerWidth <= 768 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
	if (isLowPower || reduceMotion) return;

	const SCENE_URL = "https://prod.spline.design/0do3TNYr0foFxvtp/scene.splinecode";
	const SHAPE_NAME = "Triangle";
	const THEME_COLOR = "#5dcaa5";

	function loadSpline() {
	import("https://unpkg.com/@splinetool/runtime@1.9.59/build/runtime.js")
		.then(({ Application }) => {
			const spline = new Application(canvas);
			return spline.load(SCENE_URL).then(() => spline);
		})
		.then((spline) => {
			if (typeof spline.stop === "function") spline.stop();

			const shape = spline.findObjectByName(SHAPE_NAME);
			if (!shape) {
				console.warn(`Footer: no Spline object named "${SHAPE_NAME}" — check spline.getAllObjects() for the real name in this scene.`);
				return;
			}

			try {
				const applyColor = (material) => {
					if (material && material.color && typeof material.color.set === "function") {
						material.color.set(THEME_COLOR);
					}
				};
				const recolorNode = (node) => {
					if (!node || !node.material) return;
					(Array.isArray(node.material) ? node.material : [node.material]).forEach(applyColor);
				};
				if (typeof shape.traverse === "function") shape.traverse(recolorNode);
				else recolorNode(shape);
			} catch (err) {
				console.warn("Footer: could not recolor Spline shape.", err);
			}

			if (reduceMotion) return;

			const shapeTl = gsap.timeline({ defaults: { ease: "none" } });
			shapeTl.to(shape.rotation, { x: `+=${Math.PI * 0.15}`, y: `+=${-Math.PI * 0.35}`, duration: 1 }, 0);
			shapeTl.to(shape.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 1 / 6, ease: "sine.inOut" }, 0);

			ScrollTrigger.create({
				trigger: footerEl,
				start: "top bottom",
				end: "bottom bottom",
				scrub: 1,
				animation: shapeTl,
			});

			ScrollTrigger.refresh();
		})
		.catch((err) => {
			console.error("Footer: failed to load Spline scene.", err);
		});
	}

	const _splineObserver = new IntersectionObserver(([entry]) => {
		if (!entry.isIntersecting) return;
		_splineObserver.disconnect();
		loadSpline();
	}, { rootMargin: "600px 0px" });
	_splineObserver.observe(footerEl);

});
