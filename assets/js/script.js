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

// Projects

const container = document.querySelector('.project-content');
projects.forEach((project) => {
	container.innerHTML +=
		`<div class="card">
			<div class="card-content">
			<h3 class="card-heading">${project.name}</h3>
			<p class="card-description">${project.description}</p>
			<div class="buttons">
			  <button onclick="window.open('${project.url}', '_blank')" class="card-button">Visit&nbsp;<i class="fa-solid fa-arrow-up-right-from-square"></i></button>
			</div>
			</div>
  		</div>`
})

// Nav

const links = document.querySelectorAll(".nav-link");
Array.from(links).forEach(link => {
	if (link.getAttribute('data-scroll')) {
		link.onclick = () => window.scrollTo({ top: document.querySelector(link.getAttribute("data-scroll")).offsetTop, behavior: 'smooth' })
	}
})