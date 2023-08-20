
AOS.init();


window.addEventListener('scroll', e => {
	if (document.documentElement.scrollTop > 20) {
		const nav = document.getElementById('nav')
		nav.style.backgroundColor = 'rgba(0,0,0,0.5)'
		nav.style.backdropFilter = 'blur(5px)'
	} else {
		nav.style.boxShadow = 'inset 0 -1px 0 0 hsla(0,0%,100%,0.1)'
		nav.style.backgroundColor = 'transparent'
	}
})

const tips = [
	{
		query: '#discord',
		content: 'Discord'
	},
	{
		query: '#instagram',
		content: 'Instagram',
	},
	{
		query: '#github',
		content: 'Github',
	},
];

for (const { query, content } of tips) {
	tippy(query, { content })
}


const sr = ScrollReveal({
	origin: 'bottom',
	distance: '60px',
	duration: 1000,
	delay: 400
})

const ops = { interval: 100 }

sr.reveal('.head, .paragraph, .hero-button', ops);
sr.reveal('.icon', ops);
sr.reveal(".about-title, .about-img, .about-text, .about-description.grey", ops);
sr.reveal('.stats-item', ops);
sr.reveal('.card', { interval: 100, delay: 50 })
// Project Right
sr.reveal(".right .project-image", { interval: 100, origin: 'left', distance: '60px', duration: 2000 })
sr.reveal('.right .project-content', { interval: 100, origin: 'right', distance: '60px', duration: 2000 })
// Project Left
sr.reveal(".left .project-image", { interval: 100, origin: 'right', distance: '180px', duration: 2000 })
sr.reveal('.left .project-content', { interval: 100, origin: 'left', distance: '180px', duration: 2000 })

// Projects
const countryImage = document.querySelector('.country-image');
const countryImages = ['country1.png', 'country2.png', 'country3.png'];
let i = 0;
setInterval(() => {
	countryImage.style.opacity = 0;
	setTimeout(() => {
		countryImage.src = 'assets/img/' + countryImages[i];
		countryImage.style.opacity = 1;
	}, 500);
	i = (i + 1) % countryImages.length;
}, 3000);


// Blob
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(452, 250);
const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const sphere_geometry = new THREE.SphereGeometry(1, 128, 128);
const material = new THREE.MeshNormalMaterial();
let sphere = new THREE.Mesh(sphere_geometry, material);
scene.add(sphere);
const update = function () {
	const time = performance.now() * 0.003;
	const k = 3;
	for (let i = 0; i < sphere.geometry.vertices.length; i++) {
		let p = sphere.geometry.vertices[i];
		p.normalize().multiplyScalar(1 + 0.3 * noise.perlin3(p.x * k + time, p.y * k, p.z * k));
	}
	sphere.geometry.computeVertexNormals();
	sphere.geometry.normalsNeedUpdate = true;
	sphere.geometry.verticesNeedUpdate = true;
}
function animate() {
	update();
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Nav

const links = document.querySelectorAll(".nav-link");
Array.from(links).forEach(link => {
	if (link.getAttribute('data-scroll')) {
		link.onclick = () => window.scrollTo({ top: document.querySelector(link.getAttribute("data-scroll")).offsetTop, behavior: 'smooth' })
	}
})
window.addEventListener('resize', add)
function add() {
	if (window.innerWidth < 900) {
		document.body.classList.add('mobile')
	} else {
		document.body.classList.remove('mobile')
	}
}
let hamburger = document.querySelector('.hamburger')
let mobileNav = document.querySelector('.nav-list')
let bars = document.querySelectorAll('.hamburger span')
let isActive = false
hamburger.addEventListener('click', function () {
	mobileNav.classList.toggle('open')
	if (!isActive) {
		bars[0].style.transform = 'rotate(45deg)'
		bars[1].style.opacity = '0'
		bars[2].style.transform = 'rotate(-45deg)'
		isActive = true
	} else {
		bars[0].style.transform = 'rotate(0deg)'
		bars[1].style.opacity = '1'
		bars[2].style.transform = 'rotate(0deg)'
		isActive = false
	}
})

// Ko-Fi
kofiWidgetOverlay.draw('popcatdev', {
	'type': 'floating-chat',
	'floating-chat.donateButton.text': 'Support me',
	'floating-chat.donateButton.background-color': '#ffffff',
	'floating-chat.donateButton.text-color': '#323842'
});

window.onload = add;