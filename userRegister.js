let intro = document.querySelector(".intro");
let logo = document.querySelector(".logo-header");
let logoSpan = document.querySelectorAll(".logo");
let bglogos = document.querySelectorAll(".intro .bglogo img");

window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        logoSpan.forEach((span, idx) => {
            setTimeout(() => {
                span.classList.add("active");
            }, (idx + 1) * 400);
        });

        setTimeout(() => {
            logoSpan.forEach((span, idx) => {
                setTimeout(() => {
                    span.classList.remove("active");
                    span.classList.add("fade");
                }, (idx + 1) * 50);
            });
        }, 3250);

        bglogos.forEach((bglogo, idx) => {
            setTimeout(() => {
                bglogo.classList.add("active");
            }, (idx + 1) * 400);
        });

        setTimeout(() => {
            bglogos.forEach((bglogo, idx) => {
                setTimeout(() => {
                    bglogo.classList.remove("active");
                    bglogo.classList.add("fade");
                }, (idx + 1) * 50);
            });
        }, 3250);

        setTimeout(() => {
            intro.classList.add("fade");
            intro.classList.add('blurred');
        }, 3290);

        setTimeout(() => {
            intro.remove();
        }, 3600);

    });
});

document.getElementById('toSignup').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default link behavior
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('faqsection').style.display = 'none';
    document.getElementById('signupForm').style.display = 'flex';
});

document.getElementById('toLogin').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('faqsection').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
});

document.getElementById('toreset').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('faqsection').style.display = 'none';
    document.getElementById('resetForm').style.display = 'flex';
});

document.getElementById('toLoginfr').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('resetForm').style.display = 'none';
    document.getElementById('faqsection').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
});


document.getElementById('loginnav').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('infomeg').style.display = 'none';
    document.getElementById('faqsection').style.display = 'none';
    document.getElementById('logsingsec').style.display = 'flex';
});

document.getElementById('infonav').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('infomeg').style.display = 'flex';
    document.getElementById('faqsection').style.display = 'none';
    document.getElementById('logsingsec').style.display = 'none';
});

document.getElementById('infofaq').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('faqsection').style.display = 'flex';
    document.getElementById('infomeg').style.display = 'none';
    document.getElementById('logsingsec').style.display = 'none';
});




function toggleAnswer(element) {
    const faq = element.parentElement;
    const answer = faq.querySelector('.faq-answer');
    const allAnswers = document.querySelectorAll('.faq-answer');

    allAnswers.forEach(ans => {
        if (ans !== answer) {
            ans.style.maxHeight = '0';
            ans.parentElement.classList.remove('active');
        }
    });

    if (faq.classList.contains('active')) {
        answer.style.maxHeight = '0';
        faq.classList.remove('active');
    } else {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        faq.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            toggleAnswer(this);
        });
    });
});
