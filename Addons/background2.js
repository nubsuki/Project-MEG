const svg = document.getElementById('svg')
const squareSize = 12
const colors = [
	'#ffd100',
	'#34657f',
	'#7ba7bc',
	'#ff6a13',
	'#a7a8aa',
	'#101820',
]

const setup = () => {
	let squareSmash
	window.clearInterval(squareSmash)
	svg.innerHTML = ''
	const windowWidth = window.innerWidth
	const windowHeight = window.innerHeight
	const squaresInX = Math.floor((windowWidth / squareSize) + 1)
	const squaresInY = Math.floor((windowHeight / squareSize) + 1)
	svg.setAttribute('viewBox', `0 0 ${windowWidth} ${windowHeight}`)


	const createRandomSquare = () => {
		const fillStyle = colors[Math.floor(Math.random() * colors.length)]
		const svgns = "http://www.w3.org/2000/svg";
		const parentSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		const rect = document.createElementNS(svgns, 'rect');
		const randomCol = Math.floor(Math.random() * squaresInX)
		const randomRow = Math.floor(Math.random() * squaresInY)
		const sizeRoll = Math.floor(Math.random() * 100)
		let sizeMultiplier = 1
		if (sizeRoll >= 90) sizeMultiplier = 2
		if (sizeRoll >= 95) sizeMultiplier = 3
		if (sizeRoll >= 99) sizeMultiplier = 5
		rect.setAttribute('height', squareSize * sizeMultiplier)
		rect.setAttribute('width', squareSize * sizeMultiplier)
		rect.setAttribute('x', '100%')
		rect.setAttribute('y', '100%')
		rect.setAttribute('fill', fillStyle)
		parentSVG.setAttribute('height', squareSize * sizeMultiplier)
		parentSVG.setAttribute('width', squareSize * sizeMultiplier)
		parentSVG.setAttribute('viewBox', `0 0 ${squareSize * sizeMultiplier} ${squareSize * sizeMultiplier}`)
		parentSVG.setAttribute('x', randomCol * squareSize)
		parentSVG.setAttribute('y', randomRow * squareSize)
		rect.style.animationName = `fade_in_out`
		rect.style.animationDuration = `${Math.floor((Math.random() * 15000) + 10000)}ms`
		rect.style.animationDelay = `${Math.floor((Math.random() * 15000) - 5000)}ms`
		parentSVG.appendChild(rect)
		svg.appendChild(parentSVG)
	}

	for (let i = 0; i < (squaresInY * squaresInX / 10); i++) {
		createRandomSquare()
	}
}

setup()

window.addEventListener('resize', setup)