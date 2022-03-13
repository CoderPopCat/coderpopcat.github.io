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

sr.reveal('.head, .paragraph, .hero-button', ops)
sr.reveal('.icon', ops)
sr.reveal(".about-title, .about-img, .about-text", ops)
sr.reveal('.stats-item', ops)