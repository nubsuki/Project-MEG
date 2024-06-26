const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const randomChar = () => chars[Math.floor(Math.random() * chars.length)],
      randomString = length => Array.from(Array(length)).map(randomChar).join("");

const card = document.querySelector(".bg"),
      letters = card.querySelector(".bg-letters");

const handleOnMove = e => {
  const rect = card.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top;

  letters.style.setProperty("--x", `${x}px`);
  letters.style.setProperty("--y", `${y}px`);

  letters.innerText = randomString(40000);
}

document.addEventListener('mousemove', handleOnMove);
document.addEventListener('touchmove', e => handleOnMove(e.touches[0]));
